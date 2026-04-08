import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';

export class FinancialConnector implements ISourceConnector {
  readonly type = 'financial' as const;

  constructor(readonly id: string) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const payload = {
      payments: [
        { amount: 1899, currency: 'USD', method: 'card', status: 'paid', orderId: 'SO-1001' },
        { amount: 4500, currency: 'USD', method: 'pix', status: 'pending', orderId: 'SO-1002' }
      ],
      financialRecords: [
        { type: 'income', description: 'Monthly subscriptions', amount: 24000, category: 'MRR' },
        { type: 'expense', description: 'Cloud costs', amount: 8200, category: 'infrastructure' }
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
            priority: 9,
            tags: ['finance', 'cashflow']
          }
        }
      ]
    };
  }
}
