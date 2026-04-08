import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';

export class ErpConnector implements ISourceConnector {
  readonly type = 'erp' as const;

  constructor(readonly id: string) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const payload = {
      products: [
        { name: 'Plano Enterprise', sku: 'ENT-001', category: 'subscription', price: 1899 },
        { name: 'Servico de Implantacao', sku: 'IMP-002', category: 'service', price: 4500 }
      ],
      orders: [
        { orderNumber: 'SO-1001', status: 'approved', total: 1899 },
        { orderNumber: 'SO-1002', status: 'pending', total: 4500 }
      ],
      operations: [
        { name: 'Onboarding fluxo', status: 'running', team: 'ops', severity: 'medium' }
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
            priority: 7,
            tags: ['operations', 'orders']
          }
        }
      ]
    };
  }
}
