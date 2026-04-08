import type { DocumentMetadata, FinalReport } from './types';

export function buildFinalReport(params: {
  metadata: DocumentMetadata[];
  chunksCount: number;
  fileTypes: Record<string, number>;
  processed: number;
  skipped: number;
  unsupported: number;
  errors: number;
  startedAt: number;
}): FinalReport {
  const duplicateDocuments = params.metadata.filter((entry) => entry.similar_docs.length > 0).length;
  const avgQuality =
    params.metadata.length === 0
      ? 0
      : Number(
          (
            params.metadata.reduce((sum, entry) => sum + entry.qualidade, 0) /
            params.metadata.length
          ).toFixed(2)
        );

  const domains: Record<string, number> = {};
  for (const entry of params.metadata) {
    domains[entry.dominio] = (domains[entry.dominio] ?? 0) + 1;
  }

  return {
    total_arquivos: params.processed + params.skipped + params.unsupported + params.errors,
    tipos_arquivo: params.fileTypes,
    dominios_detectados: domains,
    quantidade_chunks: params.chunksCount,
    media_qualidade: avgQuality,
    documentos_duplicados: duplicateDocuments,
    processados: params.processed,
    ignorados_idempotencia: params.skipped,
    nao_suportados: params.unsupported,
    erros: params.errors,
    tempo_execucao_ms: Date.now() - params.startedAt,
    gerado_em: new Date().toISOString()
  };
}
