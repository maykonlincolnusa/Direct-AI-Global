export type CanonicalEntityType =
  | 'Customer'
  | 'Lead'
  | 'Company'
  | 'Product'
  | 'Order'
  | 'Payment'
  | 'FinancialRecord'
  | 'OperationalEvent'
  | 'Message'
  | 'WebsitePage'
  | 'SocialPost'
  | 'BusinessProfile'
  | 'Document'
  | 'FileAsset'
  | 'Review'
  | 'Campaign';

export type BusinessDomain =
  | 'sales'
  | 'finance'
  | 'operations'
  | 'digital'
  | 'customer'
  | 'knowledge';

export type IndustryType =
  | 'general'
  | 'professional_services'
  | 'local_services'
  | 'retail_ecommerce'
  | 'healthcare'
  | 'education'
  | 'real_estate'
  | 'manufacturing_b2b';

export interface CanonicalRelationship {
  type: string;
  targetEntityType?: CanonicalEntityType;
  targetId?: string;
  label?: string;
}

export interface CanonicalSignal {
  key: string;
  value: string | number | boolean;
  domain: BusinessDomain;
  weight?: number;
}

export interface CanonicalBase {
  id: string;
  tenantId: string;
  entityType: CanonicalEntityType;
  source: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  attributes: Record<string, unknown>;
  domains?: BusinessDomain[];
  industryHints?: IndustryType[];
  relationships?: CanonicalRelationship[];
  signals?: CanonicalSignal[];
  qualityScore?: number;
  confidence?: number;
  locale?: string;
  currency?: string;
  timezone?: string;
  sourceMetadata?: {
    sourceType?: string;
    sourceId?: string;
    collectedAt?: string;
    checksum?: string;
    priority?: number;
    tags?: string[];
  };
}

export interface Customer extends CanonicalBase {
  entityType: 'Customer';
  attributes: {
    name: string;
    segment?: string;
    lifetimeValue?: number;
    email?: string;
    phone?: string;
  };
}

export interface Lead extends CanonicalBase {
  entityType: 'Lead';
  attributes: {
    name: string;
    stage: string;
    score?: number;
    owner?: string;
    expectedValue?: number;
  };
}

export interface Company extends CanonicalBase {
  entityType: 'Company';
  attributes: {
    legalName: string;
    market?: string;
    positioning?: string;
    website?: string;
  };
}

export interface Product extends CanonicalBase {
  entityType: 'Product';
  attributes: {
    name: string;
    sku?: string;
    category?: string;
    price?: number;
  };
}

export interface Order extends CanonicalBase {
  entityType: 'Order';
  attributes: {
    orderNumber: string;
    status: string;
    total?: number;
    customerId?: string;
  };
}

export interface Payment extends CanonicalBase {
  entityType: 'Payment';
  attributes: {
    amount: number;
    currency: string;
    method?: string;
    status: string;
    orderId?: string;
  };
}

export interface FinancialRecord extends CanonicalBase {
  entityType: 'FinancialRecord';
  attributes: {
    type: 'income' | 'expense' | 'projection';
    description: string;
    amount: number;
    category?: string;
    period?: string;
  };
}

export interface OperationalEvent extends CanonicalBase {
  entityType: 'OperationalEvent';
  attributes: {
    name: string;
    status: string;
    team?: string;
    severity?: 'low' | 'medium' | 'high';
  };
}

export interface Message extends CanonicalBase {
  entityType: 'Message';
  attributes: {
    channel: 'email' | 'whatsapp' | 'chat' | 'social' | 'other';
    direction: 'inbound' | 'outbound';
    body: string;
    contact?: string;
  };
}

export interface WebsitePage extends CanonicalBase {
  entityType: 'WebsitePage';
  attributes: {
    url: string;
    title?: string;
    description?: string;
    headings?: string[];
    ctas?: string[];
    keywords?: string[];
    tone?: string;
    positioningSignals?: string[];
  };
}

export interface SocialPost extends CanonicalBase {
  entityType: 'SocialPost';
  attributes: {
    network: string;
    content: string;
    publishedAt?: string;
    engagement?: number;
    campaignId?: string;
  };
}

export interface BusinessProfile extends CanonicalBase {
  entityType: 'BusinessProfile';
  attributes: {
    businessName: string;
    category?: string;
    rating?: number;
    address?: string;
    phone?: string;
    openingHours?: string[];
  };
}

export interface Document extends CanonicalBase {
  entityType: 'Document';
  attributes: {
    title: string;
    content: string;
    language?: string;
    tags?: string[];
  };
}

export interface FileAsset extends CanonicalBase {
  entityType: 'FileAsset';
  attributes: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksum?: string;
    storagePath: string;
  };
}

export interface Review extends CanonicalBase {
  entityType: 'Review';
  attributes: {
    author?: string;
    rating?: number;
    text: string;
    channel?: string;
  };
}

export interface Campaign extends CanonicalBase {
  entityType: 'Campaign';
  attributes: {
    name: string;
    channel?: string;
    objective?: string;
    budget?: number;
    status?: string;
  };
}

export type CanonicalEntity =
  | Customer
  | Lead
  | Company
  | Product
  | Order
  | Payment
  | FinancialRecord
  | OperationalEvent
  | Message
  | WebsitePage
  | SocialPost
  | BusinessProfile
  | Document
  | FileAsset
  | Review
  | Campaign;
