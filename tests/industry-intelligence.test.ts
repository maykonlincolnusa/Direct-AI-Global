import test from 'node:test';
import assert from 'node:assert/strict';
import { IndustryIntelligence } from '../src/industry/industry-intelligence';
import { CanonicalEntity } from '../src/models/canonical';
import { IntegrationRegistration } from '../src/registry/types';

function makeEntity(
  entityType: CanonicalEntity['entityType'],
  attributes: Record<string, unknown>,
  overrides: Partial<CanonicalEntity> = {}
): CanonicalEntity {
  return {
    id: `${entityType.toLowerCase()}-1`,
    tenantId: 'tenant-a',
    entityType,
    source: 'crm:hubspot',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    attributes,
    domains: ['sales'],
    industryHints: ['professional_services'],
    ...overrides
  } as CanonicalEntity;
}

test('industry intelligence infers professional services and recommends missing connectors', () => {
  const intelligence = new IndustryIntelligence();
  const entities: CanonicalEntity[] = [
    makeEntity('Lead', { name: 'ACME Proposal', stage: 'proposal', score: 88 }, { domains: ['sales', 'digital'] }),
    makeEntity('Customer', { name: 'ACME Corp', segment: 'B2B' }, { domains: ['customer'] }),
    makeEntity('Payment', { amount: 3500, currency: 'USD', status: 'paid' }, { domains: ['finance'] })
  ];

  const connectors: IntegrationRegistration[] = [
    {
      connectorId: 'crm-main',
      tenantId: 'tenant-a',
      sourceType: 'crm',
      displayName: 'Main CRM',
      status: 'active',
      syncMode: 'scheduled',
      priority: 1,
      credentialsEnvKeys: [],
      capabilities: ['leads', 'customers'],
      domainCoverage: ['sales', 'customer'],
      credentialsStatus: 'configured',
      healthCheck: { state: 'ok' },
      sync: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const assessment = intelligence.assess(entities, connectors);

  assert.equal(assessment.primaryIndustry, 'professional_services');
  assert.ok(assessment.readiness.overallScore > 0);
  assert.ok(assessment.recommendedConnectors.some((item) => item.connectorType === 'manual_upload'));
});
