import type { ContentType, DocumentMetadata, Domain } from './types';
import { extractKeywords, inferTitle, summarizeText, textQualityScore } from '../utils/text';
import { toHumanBytes } from '../utils/io';

export function buildMetadata(params: {
  id: string;
  text: string;
  domain: Domain;
  type: ContentType;
  author: string;
  language: string;
  sizeBytes: number;
  sourcePath: string;
}): DocumentMetadata {
  return {
    id: params.id,
    titulo: inferTitle(params.text),
    dominio: params.domain,
    tipo: params.type,
    autor: params.author || 'unknown',
    idioma: params.language || 'unknown',
    qualidade: clampScore(textQualityScore(params.text)),
    resumo: summarizeText(params.text),
    palavras_chave: extractKeywords(params.text),
    tamanho: toHumanBytes(params.sizeBytes),
    origem: params.sourcePath,
    data_processamento: new Date().toISOString(),
    similar_docs: []
  };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}
