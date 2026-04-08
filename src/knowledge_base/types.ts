export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  source: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  documentId: string;
  tenantId: string;
  text: string;
  order: number;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
}

export interface KnowledgeBaseStats {
  documents: number;
  chunks: number;
  embeddings: {
    provider: string;
    dimensions: number;
    fallback?: string;
  };
  vectorStore: {
    provider: string;
    vectors: number;
    dimensions: number | null;
    details?: Record<string, unknown>;
  };
}

export interface IKnowledgeRepository {
  upsertDocument(document: KnowledgeDocument): Promise<void>;
  listDocuments(tenantId: string): Promise<KnowledgeDocument[]>;
}

export interface IChunkRepository {
  upsertChunks(chunks: KnowledgeChunk[]): Promise<void>;
  listChunks(tenantId: string): Promise<KnowledgeChunk[]>;
}

export interface IMetadataRepository {
  storeEmbedding(chunkId: string, vector: number[]): Promise<void>;
  getEmbedding(chunkId: string): Promise<number[] | null>;
}
