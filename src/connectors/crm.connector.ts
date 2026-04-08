import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';
import { fetchJson, withQuery } from '../utils/http';

interface HubSpotListResponse<T> {
  results?: T[];
  paging?: {
    next?: {
      after?: string;
    };
  };
}

interface HubSpotContact {
  id: string;
  properties?: Record<string, string | null>;
}

interface HubSpotDeal {
  id: string;
  properties?: Record<string, string | null>;
}

export interface CrmConnectorOptions {
  provider?: 'hubspot';
  accessToken?: string;
  baseUrl?: string;
  limit?: number;
}

export class CrmConnector implements ISourceConnector {
  readonly type = 'crm' as const;
  private readonly provider: 'hubspot';
  private readonly accessToken?: string;
  private readonly baseUrl: string;
  private readonly limit: number;

  constructor(readonly id: string, private readonly options: CrmConnectorOptions = {}) {
    this.provider = options.provider ?? 'hubspot';
    this.accessToken = options.accessToken ?? process.env.HUBSPOT_ACCESS_TOKEN;
    this.baseUrl = (options.baseUrl ?? process.env.HUBSPOT_API_URL ?? 'https://api.hubapi.com').replace(/\/+$/, '');
    this.limit = Number(options.limit ?? process.env.HUBSPOT_SYNC_LIMIT ?? 50);
  }

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    if (this.provider !== 'hubspot') {
      throw new Error(`Unsupported CRM provider: ${this.provider}`);
    }

    if (!this.accessToken) {
      return {
        health: 'degraded',
        records: []
      };
    }

    const [contacts, deals] = await Promise.all([
      this.fetchContacts(context.cursor),
      this.fetchDeals(context.cursor)
    ]);

    const payload = {
      provider: this.provider,
      leads: deals.results.map((deal) => ({
        name: normalizeDealName(deal.properties),
        stage: String(deal.properties?.dealstage ?? 'new'),
        score: normalizeDealScore(deal.properties),
        owner: String(deal.properties?.hubspot_owner_id ?? ''),
        expectedValue: Number(deal.properties?.amount ?? 0)
      })),
      customers: contacts.results.map((contact) => ({
        name: [contact.properties?.firstname, contact.properties?.lastname].filter(Boolean).join(' ').trim() || 'Unnamed contact',
        segment: String(contact.properties?.lifecyclestage ?? ''),
        lifetimeValue: Number(contact.properties?.hs_ltv ?? 0),
        email: String(contact.properties?.email ?? ''),
        phone: String(contact.properties?.phone ?? '')
      }))
    };

    return {
      health: payload.leads.length > 0 || payload.customers.length > 0 ? 'ok' : 'degraded',
      nextCursor: deals.nextCursor ?? contacts.nextCursor,
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
            cursor: deals.nextCursor ?? contacts.nextCursor,
            priority: 9,
            tags: ['commercial', 'crm', this.provider]
          }
        }
      ]
    };
  }

  private async fetchContacts(after?: string) {
    const url = withQuery(`${this.baseUrl}/crm/v3/objects/contacts`, {
      limit: this.limit,
      after,
      properties: 'firstname,lastname,email,phone,lifecyclestage,hs_ltv'
    });

    const response = await fetchJson<HubSpotListResponse<HubSpotContact>>(url, {
      headers: this.authHeaders()
    });

    return {
      results: response.results ?? [],
      nextCursor: response.paging?.next?.after
    };
  }

  private async fetchDeals(after?: string) {
    const url = withQuery(`${this.baseUrl}/crm/v3/objects/deals`, {
      limit: this.limit,
      after,
      properties: 'dealname,dealstage,amount,hubspot_owner_id,hs_priority'
    });

    const response = await fetchJson<HubSpotListResponse<HubSpotDeal>>(url, {
      headers: this.authHeaders()
    });

    return {
      results: response.results ?? [],
      nextCursor: response.paging?.next?.after
    };
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken as string}`,
      'Content-Type': 'application/json'
    };
  }
}

function normalizeDealName(properties: Record<string, string | null> | undefined) {
  return String(properties?.dealname ?? properties?.dealstage ?? 'Unnamed deal');
}

function normalizeDealScore(properties: Record<string, string | null> | undefined) {
  const priority = String(properties?.hs_priority ?? '').toLowerCase();
  if (priority === 'high') return 85;
  if (priority === 'medium') return 60;
  if (priority === 'low') return 35;
  return 50;
}
