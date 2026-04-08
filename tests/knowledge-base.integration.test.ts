import test from 'node:test';
import assert from 'node:assert/strict';
import { TenantKnowledgeBase } from '../src/knowledge_base/in-memory-knowledge-base';

test('knowledge base persists and retrieves tenant chunks', async () => {
  const kb = new TenantKnowledgeBase();

  await kb.upsert({
    tenantId: 'tenant-integration',
    source: 'manual_upload',
    title: 'Commercial and financial alignment',
    content:
      'Sales team improved qualification and finance team reduced CAC by controlling campaign budget and prioritizing profitable segments.',
    metadata: { channel: 'manual' }
  });

  const stats = await kb.getStats('tenant-integration');
  const result = await kb.search('tenant-integration', 'qualification and campaign budget', 3);

  assert.ok(stats.documents >= 1);
  assert.ok(stats.chunks >= 1);
  assert.ok(stats.vectorStore.vectors >= 1);
  assert.ok(result.length >= 1);
});
