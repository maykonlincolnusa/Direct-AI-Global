import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { UsageBillingTracker } from '../src/billing/usage-billing';
import { ContextStorage } from '../src/storage/context-storage';

test('usage billing tracker aggregates cost and tokens by tenant and module', async () => {
  const tenantId = `tenant-usage-${randomUUID()}`;
  const tracker = new UsageBillingTracker(new ContextStorage());

  await tracker.trackAnswer({
    tenantId,
    userId: 'user-1',
    module: 'copilot',
    workflow: 'chat',
    model: 'openrouter:balanced',
    prompt: 'Summarize business context',
    contextText: 'Revenue, payments, leads and website performance data available.',
    answer: 'Commercial performance is stronger than financial conversion.',
    cached: false
  });

  await tracker.trackAnswer({
    tenantId,
    userId: 'user-1',
    module: 'copilot',
    workflow: 'diagnosis',
    model: 'openrouter:reasoning',
    prompt: 'Explain why margin dropped',
    contextText: 'Orders grew 18% but payment recovery and pricing discipline weakened.',
    answer: 'Margin dropped because collections lagged order growth and discounting increased.',
    cached: false
  });

  const summary = await tracker.summarizeTenant(tenantId);

  assert.equal(summary.tenantId, tenantId);
  assert.equal(summary.requests, 2);
  assert.ok(summary.totalTokens > 0);
  assert.ok(summary.totalCost > 0);
  assert.equal(summary.modules.copilot?.requests, 2);
  assert.ok((summary.modules.copilot?.tokens ?? 0) >= summary.totalTokens / 2);
  assert.equal(summary.recent.length, 2);
});
