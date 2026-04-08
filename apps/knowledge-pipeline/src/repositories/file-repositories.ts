import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PIPELINE_PATHS } from '../pipeline/config';
import type { DocumentChunk, DocumentMetadata, ProcessedDocument } from '../pipeline/types';
import { readJson, readUtf8, writeJson, writeUtf8 } from '../utils/io';
import type { IChunkRepository, IKnowledgeRepository, IMetadataRepository } from './interfaces';

export class FileKnowledgeRepository implements IKnowledgeRepository {
  async saveProcessedDocument(document: ProcessedDocument) {
    const target = resolve(PIPELINE_PATHS.processed, `${document.id}.txt`);
    await writeUtf8(target, document.text);
  }

  async readProcessedDocument(documentId: string) {
    return readUtf8(resolve(PIPELINE_PATHS.processed, `${documentId}.txt`));
  }

  async listProcessedDocumentIds() {
    const entries = await readdir(PIPELINE_PATHS.processed);
    return entries
      .filter((name) => name.endsWith('.txt'))
      .map((name) => name.replace(/\.txt$/i, ''));
  }
}

export class FileChunkRepository implements IChunkRepository {
  async saveChunks(documentId: string, chunks: DocumentChunk[]) {
    await writeJson(resolve(PIPELINE_PATHS.chunks, `${documentId}.json`), chunks);
  }

  async readChunks(documentId: string) {
    return readJson(resolve(PIPELINE_PATHS.chunks, `${documentId}.json`), [] as DocumentChunk[]);
  }
}

export class FileMetadataRepository implements IMetadataRepository {
  async saveMetadata(metadata: DocumentMetadata) {
    await writeJson(resolve(PIPELINE_PATHS.metadata, `${metadata.id}.json`), metadata);
  }

  async readMetadata(documentId: string) {
    return readJson(resolve(PIPELINE_PATHS.metadata, `${documentId}.json`), null);
  }

  async listAllMetadata() {
    const entries = await readdir(PIPELINE_PATHS.metadata);
    const files = entries.filter(
      (name) => name.endsWith('.json') && name !== '_state.json'
    );

    const metadata = await Promise.all(
      files.map((name) =>
        readJson<DocumentMetadata | null>(resolve(PIPELINE_PATHS.metadata, name), null)
      )
    );

    return metadata.filter((entry): entry is DocumentMetadata => Boolean(entry));
  }
}
