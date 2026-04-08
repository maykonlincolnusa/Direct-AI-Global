import { ConnectorContext, ConnectorSyncResult, ISourceConnector, SourceRecord } from './types';
import { generateId, hashString } from '../utils/id';
import { fetchJson, withQuery } from '../utils/http';

interface GoogleBusinessLocationsResponse {
  locations?: Array<Record<string, unknown>>;
  nextPageToken?: string;
}

interface GoogleBusinessReviewsResponse {
  reviews?: Array<Record<string, unknown>>;
  nextPageToken?: string;
}

type GoogleBusinessLocationRecord = Record<string, unknown> & {
  locationName?: unknown;
  title?: unknown;
  averageRating?: unknown;
  metadata?: {
    averageRating?: unknown;
  };
  primaryPhone?: unknown;
  websiteUri?: unknown;
  storefrontAddress?: {
    addressLines?: unknown;
    locality?: unknown;
    administrativeArea?: unknown;
    regionCode?: unknown;
  };
  primaryCategory?: {
    displayName?: unknown;
  };
  storeCode?: unknown;
  regularHours?: {
    periods?: Array<GoogleBusinessHoursPeriod>;
  };
};

type GoogleBusinessReviewRecord = Record<string, unknown> & {
  reviewer?: {
    displayName?: unknown;
  };
  starRating?: unknown;
  rating?: unknown;
  comment?: unknown;
  reviewReply?: {
    comment?: unknown;
  };
};

type GoogleBusinessHoursPeriod = Record<string, unknown> & {
  openDay?: unknown;
  openTime?: unknown;
  closeTime?: unknown;
  open?: {
    day?: unknown;
    time?: unknown;
  };
  close?: {
    time?: unknown;
  };
};

export interface GoogleBusinessConnectorOptions {
  accountName?: string;
  locationId?: string;
  locationName?: string;
  profileName?: string;
  accessToken?: string;
  baseUrl?: string;
  limit?: number;
}

export class GoogleBusinessProfileConnector implements ISourceConnector {
  readonly type = 'google_business_profile' as const;
  private readonly accessToken?: string;
  private readonly baseUrl: string;
  private readonly limit: number;

  constructor(readonly id: string, private readonly options: GoogleBusinessConnectorOptions) {
    this.accessToken = options.accessToken ?? process.env.GOOGLE_BUSINESS_ACCESS_TOKEN;
    this.baseUrl = (options.baseUrl ?? process.env.GOOGLE_BUSINESS_API_URL ?? 'https://mybusiness.googleapis.com/v4').replace(/\/+$/, '');
    this.limit = Number(options.limit ?? process.env.GOOGLE_BUSINESS_SYNC_LIMIT ?? 20);
  }

  async sync(context: ConnectorContext): Promise<ConnectorSyncResult> {
    if (!this.accessToken) {
      return {
        health: 'degraded',
        records: []
      };
    }

    const locations = await this.resolveLocations(context.cursor);
    const records: SourceRecord[] = [];

    for (const location of locations.results.slice(0, this.limit)) {
      const record = location as GoogleBusinessLocationRecord;
      const locationName = String(location.name ?? '');
      const reviews = locationName ? await this.fetchReviews(locationName) : { results: [] };
      const payload = {
        businessName:
          String(record.locationName ?? record.title ?? this.options.profileName ?? 'Business Profile'),
        locationId: locationName.split('/').at(-1) ?? this.options.locationId ?? '',
        locationName,
        category: firstCategoryName(record),
        rating: Number(record.metadata?.averageRating ?? record.averageRating ?? 0),
        address: formatAddress(record),
        phone: String(record.primaryPhone ?? ''),
        website: String(record.websiteUri ?? ''),
        openingHours: normalizeHours(record),
        reviews: reviews.results.map((review) => {
          const reviewRecord = review as GoogleBusinessReviewRecord;
          return {
            author: String(reviewRecord.reviewer?.displayName ?? 'unknown'),
            rating: Number(reviewRecord.starRating ?? reviewRecord.rating ?? 0),
            text: String(reviewRecord.comment ?? reviewRecord.reviewReply?.comment ?? '')
          };
        })
      };

      records.push({
        id: generateId(),
        tenantId: context.tenantId,
        sourceType: this.type,
        sourceId: this.id,
        collectedAt: new Date().toISOString(),
        payload: payload as Record<string, unknown>,
        metadata: {
          checksum: hashString(JSON.stringify(payload)),
          cursor: locations.nextCursor,
          priority: 8,
          tags: ['local', 'reviews', 'google-business']
        }
      });
    }

    return {
      health: records.length > 0 ? 'ok' : 'degraded',
      records,
      nextCursor: locations.nextCursor
    };
  }

  private async resolveLocations(pageToken?: string) {
    const locationName = this.options.locationName ?? inferLocationName(this.options.accountName, this.options.locationId);
    if (locationName) {
      const location = await fetchJson<Record<string, unknown>>(`${this.baseUrl}/${locationName}`, {
        headers: this.authHeaders()
      });
      return {
        results: [location],
        nextCursor: undefined
      };
    }

    const accountName = this.options.accountName ?? process.env.GOOGLE_BUSINESS_ACCOUNT_NAME;
    if (!accountName) {
      return {
        results: [] as Record<string, unknown>[],
        nextCursor: undefined
      };
    }

    const url = withQuery(`${this.baseUrl}/${accountName}/locations`, {
      pageSize: this.limit,
      pageToken
    });
    const response = await fetchJson<GoogleBusinessLocationsResponse>(url, {
      headers: this.authHeaders()
    });

    return {
      results: response.locations ?? [],
      nextCursor: response.nextPageToken
    };
  }

  private async fetchReviews(locationName: string) {
    const url = withQuery(`${this.baseUrl}/${locationName}/reviews`, {
      pageSize: this.limit
    });
    const response = await fetchJson<GoogleBusinessReviewsResponse>(url, {
      headers: this.authHeaders()
    });

    return {
      results: response.reviews ?? [],
      nextCursor: response.nextPageToken
    };
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken as string}`,
      'Content-Type': 'application/json'
    };
  }
}

function inferLocationName(accountName: string | undefined, locationId: string | undefined) {
  if (!accountName || !locationId) return '';
  return `${accountName}/locations/${locationId}`;
}

function firstCategoryName(location: GoogleBusinessLocationRecord) {
  const primaryCategory = location.primaryCategory;
  return String(primaryCategory?.displayName ?? location.storeCode ?? '');
}

function formatAddress(location: GoogleBusinessLocationRecord) {
  const storefront = location.storefrontAddress;
  const lines = Array.isArray(storefront?.addressLines) ? (storefront.addressLines as string[]) : [];
  const city = String(storefront?.locality ?? '');
  const region = String(storefront?.administrativeArea ?? '');
  const country = String(storefront?.regionCode ?? '');
  return [...lines, city, region, country].filter(Boolean).join(', ');
}

function normalizeHours(location: GoogleBusinessLocationRecord) {
  const regularHours = location.regularHours;
  const periods = Array.isArray(regularHours?.periods) ? regularHours.periods : [];
  return periods.map((period) => {
    const openDay = String((period.openDay ?? period.open?.day ?? '')).toLowerCase();
    const openTime = String(period.openTime ?? period.open?.time ?? '');
    const closeTime = String(period.closeTime ?? period.close?.time ?? '');
    return [openDay, openTime && `${openTime}-${closeTime}`].filter(Boolean).join(' ');
  });
}
