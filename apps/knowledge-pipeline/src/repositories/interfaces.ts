import type { DocumentChunk, DocumentMetadata, ProcessedDocument } from '../pipeline/types';

export interface IKnowledgeRepository {
  saveProcessedDocument(document: ProcessedDocument): Promise<void>;
  readProcessedDocument(documentId: string): Promise<string>;
  listProcessedDocumentIds(): Promise<string[]>;
}

export interface IChunkRepository {
  saveChunks(documentId: string, chunks: DocumentChunk[]): Promise<void>;
  readChunks(documentId: string): Promise<DocumentChunk[]>;
}

export interface IMetadataRepository {
  saveMetadata(metadata: DocumentMetadata): Promise<void>;
  readMetadata(documentId: string): Promise<DocumentMetadata | null>;
  listAllMetadata(): Promise<DocumentMetadata[]>;
}
