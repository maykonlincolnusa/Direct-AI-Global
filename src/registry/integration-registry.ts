import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { IntegrationRegistration } from './types';
import { SourceConnectorType } from '../connectors/types';
import { BusinessDomain } from '../models/canonical';

const REGISTRY_FILE = resolve('.direct-context-data', 'registry', 'integrations.json');

const DEFAULT_DOMAIN_COVERAGE: Record<SourceConnectorType, BusinessDomain[]> = {
  website_reader: ['digital', 'knowledge'],
  google_business_profile: ['digital', 'customer'],
  crm: ['sales', 'customer'],
  erp: ['operations', 'sales'],
  financial: ['finance'],
  social: ['digital'],
  manual_upload: ['knowledge']
};

export class IntegrationRegistry {
  async register(params: {
    tenantId: string;
    connectorId: string;
    sourceType: SourceConnectorType;
    displayName?: string;
    priority?: number;
    syncMode?: 'manual' | 'scheduled' | 'webhook';
    credentialsEnvKeys?: string[];
    capabilities?: string[];
    domainCoverage?: BusinessDomain[];
  }) {
    const registry = await this.loadAll();
    const now = new Date().toISOString();
    const credentialsStatus = this.resolveCredentialStatus(params.credentialsEnvKeys ?? []);

    const item: IntegrationRegistration = {
      connectorId: params.connectorId,
      tenantId: params.tenantId,
      sourceType: params.sourceType,
      displayName: params.displayName ?? prettifyConnectorName(params.sourceType),
      status: 'active',
      syncMode: params.syncMode ?? 'manual',
      priority: params.priority ?? 5,
      credentialsEnvKeys: params.credentialsEnvKeys ?? [],
      capabilities: params.capabilities ?? [],
      domainCoverage: params.domainCoverage ?? DEFAULT_DOMAIN_COVERAGE[params.sourceType],
      credentialsStatus,
      healthCheck: {
        state: 'unknown'
      },
      sync: {},
      createdAt: now,
      updatedAt: now
    };

    const key = this.makeKey(params.tenantId, params.connectorId);
    registry[key] = item;
    await this.saveAll(registry);
    return item;
  }

  async updateSyncStatus(params: {
    tenantId: string;
    connectorId: string;
    health: 'ok' | 'degraded' | 'error';
    cursor?: string;
    message?: string;
  }) {
    const registry = await this.loadAll();
    const key = this.makeKey(params.tenantId, params.connectorId);
    const current = registry[key];
    if (!current) {
      throw new Error(`Connector ${params.connectorId} is not registered for tenant ${params.tenantId}`);
    }

    current.healthCheck = {
      state: params.health,
      checkedAt: new Date().toISOString(),
      message: params.message
    };
    current.status = params.health === 'error' ? 'error' : 'active';
    current.sync.lastSyncAt = new Date().toISOString();
    if (params.cursor) {
      current.sync.lastCursor = params.cursor;
    }
    current.credentialsStatus = this.resolveCredentialStatus(current.credentialsEnvKeys);
    current.updatedAt = new Date().toISOString();

    registry[key] = current;
    await this.saveAll(registry);
    return current;
  }

  async listByTenant(tenantId: string) {
    const registry = await this.loadAll();
    return Object.values(registry)
      .filter((entry) => entry.tenantId === tenantId)
      .map((entry) => ({
        ...entry,
        credentialsStatus: this.resolveCredentialStatus(entry.credentialsEnvKeys)
      }));
  }

  async summarizeByTenant(tenantId: string) {
    const items = await this.listByTenant(tenantId);
    const domains = new Set<BusinessDomain>();
    let active = 0;
    let degraded = 0;
    let error = 0;

    for (const item of items) {
      if (item.status === 'active') active += 1;
      if (item.healthCheck.state === 'degraded') degraded += 1;
      if (item.status === 'error' || item.healthCheck.state === 'error') error += 1;
      for (const domain of item.domainCoverage ?? []) {
        domains.add(domain);
      }
    }

    return {
      total: items.length,
      active,
      degraded,
      error,
      domains: [...domains]
    };
  }

  private async loadAll() {
    try {
      const raw = await readFile(REGISTRY_FILE, 'utf8');
      return JSON.parse(raw) as Record<string, IntegrationRegistration>;
    } catch {
      return {} as Record<string, IntegrationRegistration>;
    }
  }

  private async saveAll(registry: Record<string, IntegrationRegistration>) {
    await mkdir(dirname(REGISTRY_FILE), { recursive: true });
    await writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
  }

  private makeKey(tenantId: string, connectorId: string) {
    return `${tenantId}:${connectorId}`;
  }

  private resolveCredentialStatus(keys: string[]) {
    if (keys.length === 0) return 'configured' as const;
    const existing = keys.filter((key) => Boolean(process.env[key]));
    if (existing.length === keys.length) return 'configured' as const;
    if (existing.length === 0) return 'missing' as const;
    return 'partial' as const;
  }
}

function prettifyConnectorName(sourceType: SourceConnectorType) {
  return sourceType
    .split('_')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
