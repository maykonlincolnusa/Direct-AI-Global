import { normalizeText } from '../utils/text';
import { TenantKnowledgeBase } from './in-memory-knowledge-base';

export interface Citation {
  documentId: string;
  chunkId: string;
  source: string;
  title: string;
  score: number;
  excerpt: string;
  order: number;
}

export interface RetrievalResult {
  citations: Citation[];
  contextText: string;
  signature: string;
}

export class RetrievalService {
  constructor(private readonly knowledgeBase: TenantKnowledgeBase) {}

  async retrieve(tenantId: string, query: string, topK = 6): Promise<RetrievalResult> {
    const matches = await this.knowledgeBase.search(tenantId, query, topK * 2);
    const reranked = matches
      .map((match) => ({
        ...match,
        score: match.score + lexicalBoost(query, match.chunk.text) * 0.2
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);

    const citations = reranked.map((match) => ({
      documentId: match.chunk.documentId,
      chunkId: match.chunk.chunkId,
      source: String(match.chunk.metadata.source ?? 'unknown'),
      title: String(match.chunk.metadata.title ?? 'Untitled'),
      score: Number(match.score.toFixed(4)),
      excerpt: compactExcerpt(match.chunk.text),
      order: match.chunk.order
    }));

    return {
      citations,
      contextText: citations.map((citation) => `[${citation.title}] ${citation.excerpt}`).join('\n\n'),
      signature: citations.map((citation) => `${citation.chunkId}:${citation.score}`).join('|')
    };
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

function compactExcerpt(text: string, maxChars = 320) {
  const normalized = normalizeText(text);
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars)}...`;
}
