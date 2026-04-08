import test from 'node:test';
import assert from 'node:assert/strict';
import { ContextNormalizer } from '../src/ingestion/context-normalizer';
import { SourceRecord } from '../src/connectors/types';

test('normalizer maps crm payload into lead and customer canonical entities', () => {
  const normalizer = new ContextNormalizer();
  const record: SourceRecord = {
    id: 'r1',
    tenantId: 'tenant-a',
    sourceType: 'crm',
    sourceId: 'crm-1',
    collectedAt: new Date().toISOString(),
    payload: {
      leads: [{ name: 'Lead A', stage: 'qualified', score: 80 }],
      customers: [{ name: 'Customer A', segment: 'SMB', lifetimeValue: 10000 }]
    },
    metadata: {
      checksum: 'abc'
    }
  };

  const entities = normalizer.normalize(record);
  const types = entities.map((entry) => entry.entityType);
  const lead = entities.find((entry) => entry.entityType === 'Lead');

  assert.ok(types.includes('Lead'));
  assert.ok(types.includes('Customer'));
  assert.equal(entities.every((entry) => entry.tenantId === 'tenant-a'), true);
  assert.deepEqual(lead?.domains, ['sales', 'digital']);
  assert.equal(typeof lead?.qualityScore, 'number');
  assert.ok((lead?.industryHints ?? []).includes('professional_services'));
});
