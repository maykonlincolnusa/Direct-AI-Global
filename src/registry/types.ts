import { SourceConnectorType } from '../connectors/types';
import { BusinessDomain } from '../models/canonical';

export interface IntegrationRegistration {
  connectorId: string;
  tenantId: string;
  sourceType: SourceConnectorType;
  displayName?: string;
  status: 'active' | 'paused' | 'error';
  syncMode?: 'manual' | 'scheduled' | 'webhook';
  priority: number;
  credentialsEnvKeys: string[];
  capabilities?: string[];
  domainCoverage?: BusinessDomain[];
  credentialsStatus?: 'configured' | 'partial' | 'missing';
  healthCheck: {
    state: 'ok' | 'degraded' | 'error' | 'unknown';
    checkedAt?: string;
    message?: string;
  };
  sync: {
    lastSyncAt?: string;
    lastCursor?: string;
    lastRunId?: string;
  };
  createdAt: string;
  updatedAt: string;
}
