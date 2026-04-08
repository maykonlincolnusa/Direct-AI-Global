export type SupportedFileType = 'pdf' | 'txt' | 'docx' | 'csv' | 'json' | 'md';

export type Domain =
  | 'marketing'
  | 'vendas'
  | 'financas'
  | 'gestao'
  | 'estrategia'
  | 'lideranca'
  | 'produtividade'
  | 'tecnologia'
  | 'geral';

export type ContentType = 'teoria' | 'pratica' | 'estudo de caso' | 'carta' | 'artigo' | 'framework';

export interface ProcessedDocument {
  id: string;
  sourcePath: string;
  sourceSizeBytes: number;
  text: string;
  fileType: SupportedFileType;
}

export interface DocumentMetadata {
  id: string;
  titulo: string;
  dominio: Domain;
  tipo: ContentType;
  autor: string;
  idioma: string;
  qualidade: number;
  resumo: string;
  palavras_chave: string[];
  tamanho: string;
  origem: string;
  data_processamento: string;
  similar_docs: string[];
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  texto: string;
  dominio: Domain;
  tipo: ContentType;
  ordem: number;
}

export interface IngestionStateRecord {
  id: string;
  hash: string;
  sourcePath: string;
  lastProcessedAt: string;
}

export interface IngestionState {
  bySourcePath: Record<string, IngestionStateRecord>;
}

export interface FinalReport {
  total_arquivos: number;
  tipos_arquivo: Record<string, number>;
  dominios_detectados: Record<string, number>;
  quantidade_chunks: number;
  media_qualidade: number;
  documentos_duplicados: number;
  processados: number;
  ignorados_idempotencia: number;
  nao_suportados: number;
  erros: number;
  tempo_execucao_ms: number;
  gerado_em: string;
}
