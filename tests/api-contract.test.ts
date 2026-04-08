import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleDefinitions } from '../apps/platform-api/src/modules/definitions';

test('module contract keeps required gateway fields', () => {
  assert.ok(moduleDefinitions.length > 0);

  for (const definition of moduleDefinitions) {
    assert.ok(definition.key.length > 0);
    assert.ok(definition.prefix.startsWith('/'));
    assert.ok(definition.backEnd.commands.length > 0);
    assert.ok(definition.backEnd.events.length > 0);
    assert.ok(definition.tokenBudget > 0);
  }
});
