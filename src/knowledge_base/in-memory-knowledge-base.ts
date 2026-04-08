import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chunkByParagraphs } from '../utils/text';
import { generateId } from '../utils/id';
import { EmbeddingService } from './embedding-service';
import { createVectorStoreAdapter, IVectorStoreAdapter } from './vector-store';
import {
  IChunkRepository,
  IKnowledgeRepository,
  KnowledgeBaseStats,
  KnowledgeChunk,
  KnowledgeDocument,
  SearchResult
} from './types';

class InMemoryKnowledgeRepository implements IKnowledgeRepository {
  private readonly documents = new Map<string, KnowledgeDocument>();

  async upsertDocument(document: KnowledgeDocument): Promise<void> {
    this.documents.set(document.id, document);
  }

  async listDocuments(tenantId: string): Promise<KnowledgeDocument[]> {
    return [...this.documents.values()].filter((doc) => doc.tenantId === tenantId);
  }
}

class InMemoryChunkRepository implements IChunkRepository {
  private readonly chunks = new Map<string, KnowledgeChunk>();

  async upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.chunkId, chunk);
    }
  }

  async listChunks(tenantId: string): Promise<KnowledgeChunk[]> {
    return [...this.chunks.values()].filter((chunk) => chunk.tenantId === tenantId);
  }
}

class FileKnowledgeRepository extends InMemoryKnowledgeRepository {
  private readonly loadedTenants = new Set<string>();
  private readonly rootPath: string;

  constructor(rootPath = resolve('.direct-context-data', 'knowledge')) {
    super();
    this.rootPath = rootPath;
  }

  async upsertDocument(document: KnowledgeDocument): Promise<void> {
    await this.loadTenant(document.tenantId);
    await super.upsertDocument(document);
    await this.persistTenant(document.tenantId);
  }

  async listDocuments(tenantId: string): Promise<KnowledgeDocument[]> {
    await this.loadTenant(tenantId);
    return super.listDocuments(tenantId);
  }

  private async loadTenant(tenantId: string) {
    if (this.loadedTenants.has(tenantId)) return;
    this.loadedTenants.add(tenantId);

    try {
      const raw = await readFile(this.pathFor(tenantId), 'utf8');
      const parsed = JSON.parse(raw) as KnowledgeDocument[];
      for (const document of parsed) {
        await super.upsertDocument(document);
      }
    } catch {
      // first load, no persisted documents yet
    }
  }

  private async persistTenant(tenantId: string) {
    const documents = await super.listDocuments(tenantId);
    const path = this.pathFor(tenantId);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(documents, null, 2), 'utf8');
  }

  private pathFor(tenantId: string) {
    return resolve(this.rootPath, tenantId, 'documents.json');
  }
}

class FileChunkRepository extends InMemoryChunkRepository {
  private readonly loadedTenants = new Set<string>();
  private readonly rootPath: string;

  constructor(rootPath = resolve('.direct-context-data', 'knowledge')) {
    super();
    this.rootPath = rootPath;
  }

  async upsertChunks(chunks: KnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) return;
    const tenantId = chunks[0].tenantId;
    await this.loadTenant(tenantId);
    await super.upsertChunks(chunks);
    await this.persistTenant(tenantId);
  }

  async listChunks(tenantId: string): Promise<KnowledgeChunk[]> {
    await this.loadTenant(tenantId);
    return super.listChunks(tenantId);
  }

  private async loadTenant(tenantId: string) {
    if (this.loadedTenants.has(tenantId)) return;
    this.loadedTenants.add(tenantId);

    try {
      const raw = await readFile(this.pathFor(tenantId), 'utf8');
      const parsed = JSON.parse(raw) as KnowledgeChunk[];
      await super.upsertChunks(parsed);
    } catch {
      // first load, no persisted chunks yet
    }
  }

  private async persistTenant(tenantId: string) {
    const chunks = await super.listChunks(tenantId);
    const path = this.pathFor(tenantId);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(chunks, null, 2), 'utf8');
  }

  private pathFor(tenantId: string) {
    return resolve(this.rootPath, tenantId, 'chunks.json');
  }
}

export class TenantKnowledgeBase {
  private readonly documents: IKnowledgeRepository;
  private readonly chunks: IChunkRepository;
  private readonly embedding: EmbeddingService;
  private readonly vectors: IVectorStoreAdapter;

  constructor(options: { embedding?: EmbeddingService; vectorStore?: IVectorStoreAdapter } = {}) {
    this.documents = new FileKnowledgeRepository();
    this.chunks = new FileChunkRepository();
    this.embedding = options.embedding ?? new EmbeddingService();
    this.vectors = options.vectorStore ?? createVectorStoreAdapter();
  }

  async upsert(document: Omit<KnowledgeDocument, 'createdAt' | 'id'> & { id?: string }) {
    const id = document.id ?? generateId();
    const createdAt = new Date().toISOString();
    const fullDocument: KnowledgeDocument = {
      ...document,
      id,
      createdAt
    };

    await this.documents.upsertDocument(fullDocument);

    const pieces = chunkByParagraphs(fullDocument.content, 220, 700);
    const chunkList: KnowledgeChunk[] = pieces.map((text, index) => ({
      chunkId: `${id}-${index}`,
      documentId: id,
      tenantId: fullDocument.tenantId,
      text,
      order: index,
      metadata: {
        source: fullDocument.source,
        title: fullDocument.title,
        ...fullDocument.metadata
      }
    }));

    await this.chunks.upsertChunks(chunkList);

    const embeddings = await this.embedding.embedBatch(chunkList.map((chunk) => chunk.text));
    await this.vectors.upsertMany(
      fullDocument.tenantId,
      chunkList.map((chunk, index) => ({
        id: chunk.chunkId,
        vector: embeddings[index] ?? [],
        metadata: {
          documentId: chunk.documentId,
          order: chunk.order,
          source: chunk.metadata.source,
          title: chunk.metadata.title
        }
      }))
    );
  }

  async search(tenantId: string, query: string, topK = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedding.embed(query);
    const tenantChunks = await this.chunks.listChunks(tenantId);
    const byId = new Map(tenantChunks.map((chunk) => [chunk.chunkId, chunk]));
    const vectorResults = await this.vectors.search(tenantId, queryEmbedding, topK);

    return vectorResults
      .map((result) => {
        const chunk = byId.get(result.id);
        if (!chunk) return null;
        return {
          chunk,
          score: result.score
        };
      })
      .filter((entry): entry is SearchResult => Boolean(entry));
  }

  async listTenantDocuments(tenantId: string) {
    return this.documents.listDocuments(tenantId);
  }

  async getStats(tenantId: string): Promise<KnowledgeBaseStats> {
    const [documents, chunks, vectorStoreStats] = await Promise.all([
      this.documents.listDocuments(tenantId),
      this.chunks.listChunks(tenantId),
      this.vectors.getStats(tenantId)
    ]);

    return {
      documents: documents.length,
      chunks: chunks.length,
      embeddings: {
        provider: this.embedding.provider,
        dimensions: this.embedding.dimensions,
        fallback: this.embedding.fallback
      },
      vectorStore: vectorStoreStats
    };
  }
}
