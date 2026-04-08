import { Buffer } from 'node:buffer';
import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';
import { fetchJson, withQuery } from '../utils/http';

interface StripeListResponse<T> {
  data?: T[];
  has_more?: boolean;
}

interface StripePaymentIntent {
  id: string;
  amount?: number;
  currency?: string;
  status?: string;
  payment_method_types?: string[];
  metadata?: Record<string, string>;
}

interface StripeBalanceTransaction {
  id: string;
  amount?: number;
  currency?: string;
  description?: string;
  type?: string;
  reporting_category?: string;
  created?: number;
  fee?: number;
}

export interface FinancialConnectorOptions {
  provider?: 'stripe';
  secretKey?: string;
  baseUrl?: string;
  limit?: number;
}

export class FinancialConnector implements ISourceConnector {
  readonly type = 'financial' as const;
  private readonly provider: 'stripe';
  private readonly secretKey?: string;
  private readonly baseUrl: string;
  private readonly limit: number;

  constructor(readonly id: string, private readonly options: FinancialConnectorOptions = {}) {
    this.provider = options.provider ?? 'stripe';
    this.secretKey = options.secretKey ?? process.env.STRIPE_SECRET_KEY;
    this.baseUrl = (options.baseUrl ?? process.env.STRIPE_API_URL ?? 'https://api.stripe.com').replace(/\/+$/, '');
    this.limit = Number(options.limit ?? process.env.STRIPE_SYNC_LIMIT ?? 50);
  }

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    if (this.provider !== 'stripe') {
      throw new Error(`Unsupported financial provider: ${this.provider}`);
    }

    if (!this.secretKey) {
      return {
        health: 'degraded',
        records: []
      };
    }

    const [paymentIntents, balanceTransactions] = await Promise.all([
      this.fetchPaymentIntents(context.cursor),
      this.fetchBalanceTransactions(context.cursor)
    ]);

    const payload = {
      provider: this.provider,
      payments: paymentIntents.results.map((payment) => ({
        amount: Number(payment.amount ?? 0) / 100,
        currency: String(payment.currency ?? 'usd').toUpperCase(),
        method: payment.payment_method_types?.[0] ?? 'unknown',
        status: String(payment.status ?? 'unknown'),
        orderId: String(payment.metadata?.orderId ?? payment.id)
      })),
      financialRecords: balanceTransactions.results.map((entry) => ({
        type: normalizeFinancialType(entry.type),
        description: String(entry.description ?? entry.reporting_category ?? entry.type ?? 'Stripe transaction'),
        amount: Number(entry.amount ?? 0) / 100,
        category: String(entry.reporting_category ?? entry.type ?? 'payment'),
        period: entry.created ? new Date(entry.created * 1000).toISOString().slice(0, 7) : ''
      }))
    };

    return {
      health: payload.payments.length > 0 || payload.financialRecords.length > 0 ? 'ok' : 'degraded',
      nextCursor: paymentIntents.nextCursor ?? balanceTransactions.nextCursor,
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
            cursor: paymentIntents.nextCursor ?? balanceTransactions.nextCursor,
            priority: 10,
            tags: ['finance', 'payments', this.provider]
          }
        }
      ]
    };
  }

  private async fetchPaymentIntents(startingAfter?: string) {
    const url = withQuery(`${this.baseUrl}/v1/payment_intents`, {
      limit: this.limit,
      starting_after: startingAfter
    });
    const response = await fetchJson<StripeListResponse<StripePaymentIntent>>(url, {
      headers: this.authHeaders()
    });

    const rows = response.data ?? [];
    return {
      results: rows,
      nextCursor: response.has_more ? rows.at(-1)?.id : undefined
    };
  }

  private async fetchBalanceTransactions(startingAfter?: string) {
    const url = withQuery(`${this.baseUrl}/v1/balance_transactions`, {
      limit: this.limit,
      starting_after: startingAfter
    });
    const response = await fetchJson<StripeListResponse<StripeBalanceTransaction>>(url, {
      headers: this.authHeaders()
    });

    const rows = response.data ?? [];
    return {
      results: rows,
      nextCursor: response.has_more ? rows.at(-1)?.id : undefined
    };
  }

  private authHeaders() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.secretKey as string}:`).toString('base64')}`
    };
  }
}

function normalizeFinancialType(type: string | undefined) {
  if (!type) return 'income';
  if (type.includes('fee') || type.includes('adjustment')) return 'expense';
  if (type.includes('refund')) return 'expense';
  return 'income';
}
