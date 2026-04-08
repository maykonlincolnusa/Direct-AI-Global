import { normalizeText } from '../utils/text';
import { TenantKnowledgeBase } from './in-memory-knowledge-base';
import { RerankingService } from './reranking-service';

export interface Citation {
  documentId: string;
  chunkId: string;
  source: string;
  title: string;
  score: number;
  vectorScore: number;
  lexicalScore: number;
  qualityScore: number;
  recencyScore: number;
  sourceScore: number;
  excerpt: string;
  order: number;
}

export interface RetrievalResult {
  citations: Citation[];
  contextText: string;
  signature: string;
  diagnostics: {
    topScore: number;
    averageScore: number;
    citationCount: number;
  };
}

export class RetrievalService {
  private readonly reranker = new RerankingService();

  constructor(private readonly knowledgeBase: TenantKnowledgeBase) {}

  async retrieve(tenantId: string, query: string, topK = 6): Promise<RetrievalResult> {
    const matches = await this.knowledgeBase.search(tenantId, query, topK * 2);
    const reranked = this.reranker.rerank(query, matches, topK);

    const citations = reranked.map((match) => ({
      documentId: match.chunk.documentId,
      chunkId: match.chunk.chunkId,
      source: String(match.chunk.metadata.source ?? 'unknown'),
      title: String(match.chunk.metadata.title ?? 'Untitled'),
      score: Number(match.rerankScore.toFixed(4)),
      vectorScore: Number(match.vectorScore.toFixed(4)),
      lexicalScore: Number(match.lexicalScore.toFixed(4)),
      qualityScore: Number(match.qualityScore.toFixed(4)),
      recencyScore: Number(match.recencyScore.toFixed(4)),
      sourceScore: Number(match.sourceScore.toFixed(4)),
      excerpt: compactExcerpt(match.chunk.text),
      order: match.chunk.order
    }));
    const totalScore = citations.reduce((sum, citation) => sum + citation.score, 0);

    return {
      citations,
      contextText: citations.map((citation) => `[${citation.title}] ${citation.excerpt}`).join('\n\n'),
      signature: citations.map((citation) => `${citation.chunkId}:${citation.score}`).join('|'),
      diagnostics: {
        topScore: citations[0]?.score ?? 0,
        averageScore: citations.length > 0 ? Number((totalScore / citations.length).toFixed(4)) : 0,
        citationCount: citations.length
      }
    };
  }
}

function compactExcerpt(text: string, maxChars = 320) {
  const normalized = normalizeText(text);
  return normalized.length <= maxChars ? normalized : `${normalized.slice(0, maxChars)}...`;
}
