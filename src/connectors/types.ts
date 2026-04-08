export type SourceConnectorType =
  | 'website_reader'
  | 'google_business_profile'
  | 'crm'
  | 'erp'
  | 'financial'
  | 'social'
  | 'manual_upload';

export interface ConnectorContext {
  tenantId: string;
  connectorId: string;
  runId: string;
  cursor?: string;
}

export interface SourceRecord {
  id: string;
  tenantId: string;
  sourceType: SourceConnectorType;
  sourceId: string;
  collectedAt: string;
  payload: Record<string, unknown>;
  metadata: {
    cursor?: string;
    checksum: string;
    priority?: number;
    tags?: string[];
  };
}

export interface ConnectorSyncResult {
  records: SourceRecord[];
  nextCursor?: string;
  health: 'ok' | 'degraded' | 'error';
}

export interface ISourceConnector {
  readonly type: SourceConnectorType;
  readonly id: string;
  sync(context: ConnectorContext): Promise<ConnectorSyncResult>;
}
