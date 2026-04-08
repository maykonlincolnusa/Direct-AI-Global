import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';
import { fetchJson, withQuery } from '../utils/http';

interface GenericErpResponse {
  products?: Array<Record<string, unknown>>;
  orders?: Array<Record<string, unknown>>;
  operations?: Array<Record<string, unknown>>;
  nextCursor?: string;
}

export interface ErpConnectorOptions {
  baseUrl?: string;
  accessToken?: string;
  limit?: number;
  provider?: 'generic_rest';
}

export class ErpConnector implements ISourceConnector {
  readonly type = 'erp' as const;
  private readonly baseUrl?: string;
  private readonly accessToken?: string;
  private readonly limit: number;
  private readonly provider: 'generic_rest';

  constructor(readonly id: string, private readonly options: ErpConnectorOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.ERP_API_URL;
    this.accessToken = options.accessToken ?? process.env.ERP_ACCESS_TOKEN;
    this.limit = Number(options.limit ?? process.env.ERP_SYNC_LIMIT ?? 50);
    this.provider = options.provider ?? 'generic_rest';
  }

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    if (this.provider !== 'generic_rest' || !this.baseUrl) {
      return {
        health: 'degraded',
        records: []
      };
    }

    const url = withQuery(`${this.baseUrl.replace(/\/+$/, '')}/sync`, {
      cursor: context.cursor,
      limit: this.limit
    });

    const response = await fetchJson<GenericErpResponse>(url, {
      headers: this.headers()
    });

    const payload = {
      provider: this.provider,
      products: (response.products ?? []).map((product) => ({
        name: String(product.name ?? ''),
        sku: String(product.sku ?? ''),
        category: String(product.category ?? ''),
        price: Number(product.price ?? 0)
      })),
      orders: (response.orders ?? []).map((order) => ({
        orderNumber: String(order.orderNumber ?? order.id ?? ''),
        status: String(order.status ?? ''),
        total: Number(order.total ?? 0),
        customerId: String(order.customerId ?? '')
      })),
      operations: (response.operations ?? []).map((event) => ({
        name: String(event.name ?? event.type ?? ''),
        status: String(event.status ?? ''),
        team: String(event.team ?? ''),
        severity: String(event.severity ?? 'medium')
      }))
    };

    return {
      health:
        payload.products.length > 0 || payload.orders.length > 0 || payload.operations.length > 0
          ? 'ok'
          : 'degraded',
      nextCursor: response.nextCursor,
      records: [
        {
          id: generateId(),
          tenantId: context.tenantId,
          sourceType: this.type,
          sourceId: this.id,
          collectedAt: new Date().toISOString(),
          payload: payload as Record<string, unknown>,
          metadata: {
            checksum: hashString(JSON.stringify(payload)),
            cursor: response.nextCursor,
            priority: 8,
            tags: ['operations', 'erp', this.provider]
          }
        }
      ]
    };
  }

  private headers() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }
}
