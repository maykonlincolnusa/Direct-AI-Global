import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';

export class CrmConnector implements ISourceConnector {
  readonly type = 'crm' as const;

  constructor(readonly id: string) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const payload = {
      leads: [
        { name: 'Lead Alpha', stage: 'qualified', score: 82, expectedValue: 12000 },
        { name: 'Lead Beta', stage: 'proposal', score: 67, expectedValue: 8000 }
      ],
      customers: [
        { name: 'Customer Prime', segment: 'B2B', lifetimeValue: 56000, email: 'prime@example.com' }
      ]
    };

    return {
      health: 'ok',
      records: [
        {
          id: generateId(),
          tenantId: context.tenantId,
          sourceType: this.type,
          sourceId: this.id,
          collectedAt: new Date().toISOString(),
          payload: payload as unknown as Record<string, unknown>,
          metadata: {
            checksum: hashString(JSON.stringify(payload)),
            cursor: context.cursor,
            priority: 8,
            tags: ['commercial', 'pipeline']
          }
        }
      ]
    };
  }
}
