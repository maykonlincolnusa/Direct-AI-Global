import { SourceRecord } from '../connectors/types';
import {
  BusinessDomain,
  CanonicalEntity,
  CanonicalEntityType,
  IndustryType
} from '../models/canonical';
import { generateId } from '../utils/id';
import { normalizeText } from '../utils/text';

export class ContextNormalizer {
  normalize(record: SourceRecord): CanonicalEntity[] {
    switch (record.sourceType) {
      case 'website_reader':
        return this.normalizeWebsite(record);
      case 'google_business_profile':
        return this.normalizeGoogleBusiness(record);
      case 'crm':
        return this.normalizeCrm(record);
      case 'erp':
        return this.normalizeErp(record);
      case 'financial':
        return this.normalizeFinancial(record);
      case 'social':
        return this.normalizeSocial(record);
      case 'manual_upload':
        return this.normalizeManualUpload(record);
      default:
        return [];
    }
  }

  private normalizeWebsite(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const entities: CanonicalEntity[] = [
      createEntity(record, 'WebsitePage', {
        url: String(payload.url ?? ''),
        title: String(payload.title ?? ''),
        description: String(payload.description ?? ''),
        headings: ensureStringArray(payload.headings),
        ctas: ensureStringArray(payload.ctas),
        keywords: ensureStringArray(payload.keywords),
        tone: String(payload.tone ?? 'neutral'),
        positioningSignals: ensureStringArray(payload.positioningSignals)
      })
    ];

    const companyName = String(payload.companyName ?? payload.brandName ?? '').trim();
    if (companyName) {
      entities.push(
        createEntity(record, 'Company', {
          legalName: companyName,
          positioning: String(payload.positioning ?? payload.description ?? ''),
          website: String(payload.url ?? '')
        })
      );
    }

    return entities;
  }

  private normalizeGoogleBusiness(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const profile = createEntity(record, 'BusinessProfile', {
      businessName: String(payload.businessName ?? ''),
      category: String(payload.category ?? ''),
      rating: Number(payload.rating ?? 0),
      address: String(payload.address ?? ''),
      phone: String(payload.phone ?? ''),
      openingHours: ensureStringArray(payload.openingHours)
    });

    const companyName = String(payload.businessName ?? '').trim();
    const company = companyName
      ? createEntity(record, 'Company', {
          legalName: companyName,
          market: String(payload.category ?? ''),
          website: String(payload.website ?? ''),
          positioning: `Google Business Profile with rating ${String(payload.rating ?? 'unknown')}`
        })
      : null;

    const reviews = ensureObjectArray(payload.reviews).map((review) =>
      createEntity(record, 'Review', {
        author: String(review.author ?? 'unknown'),
        rating: Number(review.rating ?? 0),
        text: String(review.text ?? ''),
        channel: 'google_business_profile'
      })
    );

    return [profile, ...(company ? [company] : []), ...reviews];
  }

  private normalizeCrm(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const leads = ensureObjectArray(payload.leads).map((lead) =>
      createEntity(record, 'Lead', {
        name: String(lead.name ?? ''),
        stage: String(lead.stage ?? 'new'),
        score: Number(lead.score ?? 0),
        owner: String(lead.owner ?? ''),
        expectedValue: Number(lead.expectedValue ?? 0)
      })
    );

    const customers = ensureObjectArray(payload.customers).map((customer) =>
      createEntity(record, 'Customer', {
        name: String(customer.name ?? ''),
        segment: String(customer.segment ?? ''),
        lifetimeValue: Number(customer.lifetimeValue ?? 0),
        email: String(customer.email ?? ''),
        phone: String(customer.phone ?? '')
      })
    );

    return [...leads, ...customers];
  }

  private normalizeErp(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const products = ensureObjectArray(payload.products).map((product) =>
      createEntity(record, 'Product', {
        name: String(product.name ?? ''),
        sku: String(product.sku ?? ''),
        category: String(product.category ?? ''),
        price: Number(product.price ?? 0)
      })
    );

    const orders = ensureObjectArray(payload.orders).map((order) =>
      createEntity(record, 'Order', {
        orderNumber: String(order.orderNumber ?? ''),
        status: String(order.status ?? ''),
        total: Number(order.total ?? 0),
        customerId: String(order.customerId ?? '')
      })
    );

    const operations = ensureObjectArray(payload.operations).map((event) =>
      createEntity(record, 'OperationalEvent', {
        name: String(event.name ?? ''),
        status: String(event.status ?? ''),
        team: String(event.team ?? ''),
        severity: String(event.severity ?? 'low')
      })
    );

    return [...products, ...orders, ...operations];
  }

  private normalizeFinancial(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const payments = ensureObjectArray(payload.payments).map((payment) =>
      createEntity(record, 'Payment', {
        amount: Number(payment.amount ?? 0),
        currency: String(payment.currency ?? 'USD'),
        method: String(payment.method ?? ''),
        status: String(payment.status ?? 'pending'),
        orderId: String(payment.orderId ?? '')
      })
    );

    const entries = ensureObjectArray(payload.financialRecords).map((entry) =>
      createEntity(record, 'FinancialRecord', {
        type: String(entry.type ?? 'income'),
        description: String(entry.description ?? ''),
        amount: Number(entry.amount ?? 0),
        category: String(entry.category ?? ''),
        period: String(entry.period ?? '')
      })
    );

    return [...payments, ...entries];
  }

  private normalizeSocial(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const posts = ensureObjectArray(payload.posts).map((post) =>
      createEntity(record, 'SocialPost', {
        network: String(post.network ?? 'unknown'),
        content: String(post.content ?? ''),
        publishedAt: String(post.publishedAt ?? ''),
        engagement: Number(post.engagement ?? 0),
        campaignId: String(post.campaignId ?? '')
      })
    );

    const campaigns = ensureObjectArray(payload.campaigns).map((campaign) =>
      createEntity(record, 'Campaign', {
        name: String(campaign.name ?? ''),
        channel: String(campaign.channel ?? ''),
        objective: String(campaign.objective ?? ''),
        budget: Number(campaign.budget ?? 0),
        status: String(campaign.status ?? '')
      })
    );

    return [...posts, ...campaigns];
  }

  private normalizeManualUpload(record: SourceRecord): CanonicalEntity[] {
    const payload = record.payload;
    const file = (payload.file ?? {}) as Record<string, unknown>;
    const documentText = String(payload.documentText ?? '');

    const fileAsset = createEntity(record, 'FileAsset', {
      fileName: String(file.fileName ?? ''),
      mimeType: String(file.mimeType ?? 'application/octet-stream'),
      sizeBytes: Number(file.sizeBytes ?? 0),
      checksum: String(file.checksum ?? ''),
      storagePath: String(file.storagePath ?? '')
    });

    const entities: CanonicalEntity[] = [fileAsset];
    if (documentText.trim()) {
      entities.push(
        createEntity(record, 'Document', {
          title: String(file.fileName ?? 'Uploaded document'),
          content: documentText,
          language: String(payload.language ?? 'unknown'),
          tags: ensureStringArray(payload.tags)
        })
      );
    }
    return entities;
  }
}

function createEntity(
  record: SourceRecord,
  entityType: CanonicalEntityType,
  attributes: Record<string, unknown>
) {
  const now = new Date().toISOString();
  const domains = domainsForEntityType(entityType);
  const relationships = buildRelationships(entityType, attributes);
  const industryHints = inferIndustryHints(record, entityType, attributes);
  const signals = buildSignals(entityType, attributes, domains);
  const qualityScore = estimateQualityScore(attributes);
  return {
    id: generateId(),
    tenantId: record.tenantId,
    entityType,
    source: `${record.sourceType}:${record.sourceId}`,
    createdAt: now,
    updatedAt: now,
    version: 1,
    attributes,
    domains,
    relationships,
    industryHints,
    signals,
    qualityScore,
    confidence: Number((0.55 + qualityScore / 20).toFixed(2)),
    sourceMetadata: {
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      collectedAt: record.collectedAt,
      checksum: record.metadata.checksum,
      priority: record.metadata.priority,
      tags: record.metadata.tags
    }
  } as CanonicalEntity;
}

function ensureStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

function ensureObjectArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null);
}

function domainsForEntityType(entityType: CanonicalEntityType): BusinessDomain[] {
  switch (entityType) {
    case 'Lead':
    case 'Campaign':
      return ['sales', 'digital'];
    case 'Customer':
    case 'Review':
    case 'BusinessProfile':
    case 'Message':
      return ['customer'];
    case 'Order':
    case 'Product':
    case 'OperationalEvent':
      return ['operations'];
    case 'Payment':
    case 'FinancialRecord':
      return ['finance'];
    case 'WebsitePage':
    case 'SocialPost':
      return ['digital'];
    case 'Document':
    case 'FileAsset':
      return ['knowledge'];
    case 'Company':
      return ['sales', 'digital', 'operations'];
    default:
      return ['knowledge'];
  }
}

function buildRelationships(entityType: CanonicalEntityType, attributes: Record<string, unknown>) {
  const relationships: CanonicalEntity['relationships'] = [];

  if (entityType === 'Payment' && String(attributes.orderId ?? '').trim()) {
    relationships.push({
      type: 'belongs_to_order',
      targetEntityType: 'Order',
      targetId: String(attributes.orderId)
    });
  }

  if (entityType === 'Order' && String(attributes.customerId ?? '').trim()) {
    relationships.push({
      type: 'belongs_to_customer',
      targetEntityType: 'Customer',
      targetId: String(attributes.customerId)
    });
  }

  if (entityType === 'SocialPost' && String(attributes.campaignId ?? '').trim()) {
    relationships.push({
      type: 'belongs_to_campaign',
      targetEntityType: 'Campaign',
      targetId: String(attributes.campaignId)
    });
  }

  return relationships;
}

function inferIndustryHints(
  record: SourceRecord,
  entityType: CanonicalEntityType,
  attributes: Record<string, unknown>
): IndustryType[] {
  const text = normalizeText(
    [
      record.sourceType,
      entityType,
      ...Object.values(attributes).flatMap((value) =>
        Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value ?? '')]
      )
    ].join(' ')
  ).toLowerCase();

  const hints = new Set<IndustryType>();

  if (includesAny(text, ['appointment', 'clinic', 'patient', 'doctor', 'hospital', 'consulta'])) {
    hints.add('healthcare');
  }
  if (includesAny(text, ['student', 'course', 'lesson', 'class', 'aluno', 'curso', 'matricula'])) {
    hints.add('education');
  }
  if (includesAny(text, ['property', 'listing', 'real estate', 'imovel', 'corretor', 'visita'])) {
    hints.add('real_estate');
  }
  if (includesAny(text, ['inventory', 'sku', 'checkout', 'ecommerce', 'cart', 'catalog', 'loja'])) {
    hints.add('retail_ecommerce');
  }
  if (includesAny(text, ['factory', 'manufacturing', 'supply', 'production', 'distribuicao'])) {
    hints.add('manufacturing_b2b');
  }
  if (includesAny(text, ['restaurant', 'reservation', 'local', 'storefront', 'google business', 'whatsapp'])) {
    hints.add('local_services');
  }
  if (includesAny(text, ['proposal', 'consulting', 'service', 'proposal', 'pipeline', 'crm'])) {
    hints.add('professional_services');
  }

  if (hints.size === 0) {
    hints.add('general');
  }

  return [...hints];
}

function buildSignals(
  entityType: CanonicalEntityType,
  attributes: Record<string, unknown>,
  domains: BusinessDomain[]
) {
  const signals: CanonicalEntity['signals'] = [];

  if (entityType === 'Lead') {
    signals.push({
      key: 'lead_stage',
      value: String(attributes.stage ?? 'new'),
      domain: 'sales',
      weight: 0.8
    });
    signals.push({
      key: 'lead_score',
      value: Number(attributes.score ?? 0),
      domain: 'sales',
      weight: 0.9
    });
  }

  if (entityType === 'Payment') {
    signals.push({
      key: 'payment_status',
      value: String(attributes.status ?? 'pending'),
      domain: 'finance',
      weight: 1
    });
  }

  if (entityType === 'WebsitePage') {
    signals.push({
      key: 'has_cta',
      value: ensureStringArray(attributes.ctas).length > 0,
      domain: 'digital',
      weight: 0.7
    });
  }

  if (entityType === 'Review') {
    signals.push({
      key: 'review_rating',
      value: Number(attributes.rating ?? 0),
      domain: 'customer',
      weight: 0.85
    });
  }

  if (signals.length === 0 && domains[0]) {
    signals.push({
      key: 'entity_presence',
      value: entityType,
      domain: domains[0],
      weight: 0.4
    });
  }

  return signals;
}

function estimateQualityScore(attributes: Record<string, unknown>) {
  const values = Object.values(attributes);
  if (values.length === 0) return 0;

  const nonEmpty = values.filter((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;

  return Number(((nonEmpty / values.length) * 10).toFixed(1));
}

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}
