import { ConnectorContext, ConnectorSyncResult, ISourceConnector } from './types';
import { generateId, hashString } from '../utils/id';

export interface GoogleBusinessConnectorOptions {
  locationId: string;
  profileName: string;
}

export class GoogleBusinessProfileConnector implements ISourceConnector {
  readonly type = 'google_business_profile' as const;

  constructor(readonly id: string, private readonly options: GoogleBusinessConnectorOptions) {}

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    const basePayload = {
      businessName: this.options.profileName,
      locationId: this.options.locationId,
      rating: 4.7,
      category: 'Local Business',
      openingHours: ['09:00-18:00'],
      reviews: [
        { author: 'Cliente 1', rating: 5, text: 'Atendimento excelente e rapido.' },
        { author: 'Cliente 2', rating: 4, text: 'Boa experiencia com suporte.' }
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
          payload: basePayload as unknown as Record<string, unknown>,
          metadata: {
            checksum: hashString(JSON.stringify(basePayload)),
            cursor: context.cursor,
            priority: 6,
            tags: ['local', 'reviews']
          }
        }
      ]
    };
  }
}
