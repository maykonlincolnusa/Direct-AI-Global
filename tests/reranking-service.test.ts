import test from 'node:test';
import assert from 'node:assert/strict';
import { RerankingService } from '../src/knowledge_base/reranking-service';
import { SearchResult } from '../src/knowledge_base/types';

test('reranking promotes grounded chunks with better lexical and metadata signals', () => {
  const reranker = new RerankingService();
  const now = new Date().toISOString();

  const matches: SearchResult[] = [
    {
      score: 0.91,
      chunk: {
        chunkId: 'generic-1',
        documentId: 'doc-generic',
        tenantId: 'tenant-test',
        order: 1,
        text: 'General company overview with broad statements and little revenue detail.',
        metadata: {
          source: 'notes',
          title: 'Company Notes',
          qualityScore: 2,
          updatedAt: '2024-01-05T00:00:00.000Z',
          domains: ['general']
        }
      }
    },
    {
      score: 0.8,
      chunk: {
        chunkId: 'finance-1',
        documentId: 'doc-finance',
        tenantId: 'tenant-test',
        order: 2,
        text: 'Revenue pipeline margin and cash conversion improved after pricing changes in the clinic.',
        metadata: {
          source: 'finance-report',
          title: 'Healthcare Revenue Review',
          qualityScore: 9,
          updatedAt: now,
          domains: ['finance', 'healthcare']
        }
      }
    }
  ];

  const reranked = reranker.rerank('healthcare revenue pipeline margin', matches, 2);

  assert.equal(reranked[0]?.chunk.chunkId, 'finance-1');
  assert.ok(reranked[0].rerankScore > reranked[1].rerankScore);
  assert.ok(reranked[0].lexicalScore > reranked[1].lexicalScore);
  assert.ok(reranked[0].qualityScore > reranked[1].qualityScore);
});
