import { SearchResult } from './types';
import { normalizeText } from '../utils/text';

export interface RerankedResult extends SearchResult {
  vectorScore: number;
  lexicalScore: number;
  qualityScore: number;
  recencyScore: number;
  sourceScore: number;
  rerankScore: number;
}

export class RerankingService {
  rerank(query: string, matches: SearchResult[], topK: number) {
    return matches
      .map((match) => {
        const lexicalScore = lexicalBoost(query, match.chunk.text);
        const qualityScore = normalizeMetadataScore(match.chunk.metadata.qualityScore);
        const recencyScore = computeRecencyScore(match.chunk.metadata.updatedAt);
        const sourceScore = computeSourceScore(query, match.chunk.metadata);
        const rerankScore =
          match.score * 0.55 +
          lexicalScore * 0.2 +
          qualityScore * 0.1 +
          recencyScore * 0.05 +
          sourceScore * 0.1;

        return {
          ...match,
          vectorScore: match.score,
          lexicalScore,
          qualityScore,
          recencyScore,
          sourceScore,
          rerankScore
        } satisfies RerankedResult;
      })
      .sort((left, right) => right.rerankScore - left.rerankScore)
      .slice(0, topK);
  }
}

function lexicalBoost(query: string, text: string) {
  const queryTerms = new Set(tokenize(query));
  const textTerms = new Set(tokenize(text));
  if (queryTerms.size === 0 || textTerms.size === 0) return 0;

  let matches = 0;
  for (const term of queryTerms) {
    if (textTerms.has(term)) matches += 1;
  }
  return matches / queryTerms.size;
}

function tokenize(input: string) {
  return normalizeText(input)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/g)
    .filter((token) => token.length > 2);
}

function normalizeMetadataScore(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric / 10));
}

function computeRecencyScore(updatedAt: unknown) {
  if (typeof updatedAt !== 'string') return 0.25;
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return 0.25;
  const ageDays = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.7;
  if (ageDays <= 90) return 0.45;
  return 0.2;
}

function computeSourceScore(query: string, metadata: Record<string, unknown>) {
  const corpus = normalizeText(
    [metadata.source, metadata.title, ...(Array.isArray(metadata.domains) ? metadata.domains : [])]
      .map((entry) => String(entry ?? ''))
      .join(' ')
  ).toLowerCase();

  if (!corpus) return 0.2;
  const queryTerms = tokenize(query);
  const matches = queryTerms.filter((term) => corpus.includes(term)).length;
  if (queryTerms.length === 0) return 0.2;
  return Math.min(1, matches / Math.max(1, queryTerms.length));
}
