import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenBudgetManager } from '../packages/shared/auth/src/index';

test('token budget manager enforces composite limits', () => {
  const manager = new TokenBudgetManager({
    perRequest: 100,
    perUser: 200,
    perTenant: 500,
    perModule: 150
  });

  const first = manager.ensureCompositeBudget({
    tenantId: 'tenant-a',
    userId: 'user-a',
    moduleKey: 'sales',
    requestedTokens: 80
  });

  assert.equal(first.userRemaining, 120);
  assert.equal(first.moduleRemaining, 70);

  assert.throws(() =>
    manager.ensureCompositeBudget({
      tenantId: 'tenant-a',
      userId: 'user-a',
      moduleKey: 'sales',
      requestedTokens: 90
    })
  );
});
