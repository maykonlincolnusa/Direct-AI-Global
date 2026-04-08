import { SourceConnectorType } from '../connectors/types';
import { IntegrationRegistration } from '../registry/types';
import { BusinessDomain, CanonicalEntity, CanonicalEntityType, IndustryType } from '../models/canonical';
import {
  BusinessMetricCard,
  ConnectorRecommendation,
  DataReadinessReport,
  IndustryAssessment,
  IndustryAssessmentCandidate,
  IndustryPack,
  TenantExecutionPlan
} from './types';
import { normalizeText } from '../utils/text';

const DOMAIN_KEYS: BusinessDomain[] = ['sales', 'finance', 'operations', 'digital', 'customer', 'knowledge'];

const CONNECTOR_DOMAINS: Record<SourceConnectorType, BusinessDomain[]> = {
  website_reader: ['digital', 'knowledge'],
  google_business_profile: ['digital', 'customer'],
  crm: ['sales', 'customer'],
  erp: ['operations', 'sales'],
  financial: ['finance'],
  social: ['digital'],
  manual_upload: ['knowledge']
};

const INDUSTRY_PACKS: Record<IndustryType, IndustryPack> = {
  general: {
    key: 'general',
    label: 'General Business',
    description: 'Horizontal operating model for multi-domain businesses without strong vertical signals yet.',
    keywords: ['business', 'company', 'sales', 'marketing', 'finance', 'operations'],
    requiredDomains: ['sales', 'finance', 'operations', 'digital', 'knowledge'],
    recommendedConnectors: ['crm', 'financial', 'website_reader', 'manual_upload'],
    kpis: [
      {
        key: 'lead_to_order_ratio',
        label: 'Lead to Order Ratio',
        domain: 'sales',
        outcome: 'revenue',
        description: 'Tracks whether demand generation is converting into closed business.'
      },
      {
        key: 'cash_coverage',
        label: 'Cash Coverage',
        domain: 'finance',
        outcome: 'risk',
        description: 'Measures whether inflow visibility is enough to support current commitments.'
      }
    ],
    actionTemplates: [
      {
        title: 'Close the missing context domains',
        why: 'The platform generates better recommendations when sales, finance and digital are all connected.',
        impact: 'revenue',
        horizon: 'now'
      }
    ]
  },
  professional_services: {
    key: 'professional_services',
    label: 'Professional Services',
    description: 'Service-led businesses driven by pipeline quality, proposals, delivery capacity and retention.',
    keywords: ['proposal', 'consulting', 'service', 'cliente', 'pipeline', 'briefing'],
    requiredDomains: ['sales', 'operations', 'finance', 'knowledge'],
    recommendedConnectors: ['crm', 'financial', 'manual_upload', 'website_reader'],
    kpis: [
      {
        key: 'proposal_win_rate',
        label: 'Proposal Win Rate',
        domain: 'sales',
        outcome: 'revenue',
        description: 'Measures how much pipeline turns into signed work.'
      },
      {
        key: 'delivery_load',
        label: 'Delivery Load',
        domain: 'operations',
        outcome: 'efficiency',
        description: 'Monitors whether team capacity supports the commercial promise.'
      }
    ],
    actionTemplates: [
      {
        title: 'Prioritize late-stage deals with low confidence',
        why: 'Professional service businesses lose margin when proposals stall without qualification.',
        impact: 'revenue',
        horizon: 'now'
      },
      {
        title: 'Align sales commitments with delivery capacity',
        why: 'Revenue quality falls when projects are sold without operational readiness.',
        impact: 'risk',
        horizon: 'next'
      }
    ]
  },
  local_services: {
    key: 'local_services',
    label: 'Local Services',
    description: 'Location-based businesses that depend on reputation, local discovery, appointments and responsiveness.',
    keywords: ['reservation', 'appointment', 'local', 'google business', 'whatsapp', 'unidade'],
    requiredDomains: ['digital', 'customer', 'operations', 'finance'],
    recommendedConnectors: ['google_business_profile', 'website_reader', 'financial', 'manual_upload'],
    kpis: [
      {
        key: 'review_rating',
        label: 'Review Rating',
        domain: 'customer',
        outcome: 'retention',
        description: 'Strong reputation directly impacts local conversion.'
      },
      {
        key: 'local_response_gap',
        label: 'Local Response Gap',
        domain: 'operations',
        outcome: 'revenue',
        description: 'Measures friction between incoming demand and service response.'
      }
    ],
    actionTemplates: [
      {
        title: 'Close the gap between reviews and lead capture',
        why: 'High visibility without capture wastes local demand.',
        impact: 'revenue',
        horizon: 'now'
      }
    ]
  },
  retail_ecommerce: {
    key: 'retail_ecommerce',
    label: 'Retail and E-commerce',
    description: 'Catalog-driven businesses that need product, order, payment and campaign context in one place.',
    keywords: ['catalog', 'sku', 'checkout', 'ecommerce', 'cart', 'inventory'],
    requiredDomains: ['sales', 'finance', 'operations', 'digital', 'customer'],
    recommendedConnectors: ['erp', 'financial', 'social', 'website_reader', 'crm'],
    kpis: [
      {
        key: 'cart_to_payment_gap',
        label: 'Cart to Payment Gap',
        domain: 'finance',
        outcome: 'revenue',
        description: 'Shows leakage between commercial intent and paid orders.'
      },
      {
        key: 'campaign_to_order_signal',
        label: 'Campaign to Order Signal',
        domain: 'digital',
        outcome: 'revenue',
        description: 'Measures whether campaigns are driving actual transactions.'
      }
    ],
    actionTemplates: [
      {
        title: 'Connect product, payment and campaign data',
        why: 'Retail optimization depends on knowing which demand actually converts with margin.',
        impact: 'revenue',
        horizon: 'now'
      }
    ]
  },
  healthcare: {
    key: 'healthcare',
    label: 'Healthcare',
    description: 'Care operations that require service capacity, patient journey context and operational reliability.',
    keywords: ['clinic', 'patient', 'doctor', 'hospital', 'consulta', 'appointment'],
    requiredDomains: ['operations', 'customer', 'finance', 'knowledge'],
    recommendedConnectors: ['manual_upload', 'financial', 'website_reader', 'google_business_profile'],
    kpis: [
      {
        key: 'appointment_fulfillment',
        label: 'Appointment Fulfillment',
        domain: 'operations',
        outcome: 'efficiency',
        description: 'Tracks demand versus completed service capacity.'
      },
      {
        key: 'care_reputation',
        label: 'Care Reputation',
        domain: 'customer',
        outcome: 'retention',
        description: 'Monitors trust signals in public feedback and recurring engagement.'
      }
    ],
    actionTemplates: [
      {
        title: 'Monitor operational bottlenecks before they affect patient experience',
        why: 'Healthcare demand collapses quickly when service reliability drops.',
        impact: 'risk',
        horizon: 'now'
      }
    ]
  },
  education: {
    key: 'education',
    label: 'Education',
    description: 'Enrollment and retention businesses that depend on acquisition, progression and learning completion.',
    keywords: ['student', 'course', 'lesson', 'class', 'aluno', 'matricula'],
    requiredDomains: ['sales', 'customer', 'knowledge', 'finance'],
    recommendedConnectors: ['crm', 'manual_upload', 'financial', 'website_reader'],
    kpis: [
      {
        key: 'enrollment_conversion',
        label: 'Enrollment Conversion',
        domain: 'sales',
        outcome: 'revenue',
        description: 'Measures how many prospects become active learners.'
      },
      {
        key: 'completion_signal',
        label: 'Completion Signal',
        domain: 'knowledge',
        outcome: 'retention',
        description: 'Shows whether the learning journey is producing continuity.'
      }
    ],
    actionTemplates: [
      {
        title: 'Correlate acquisition with retention',
        why: 'Education businesses grow sustainably only when lead quality matches student completion.',
        impact: 'retention',
        horizon: 'next'
      }
    ]
  },
  real_estate: {
    key: 'real_estate',
    label: 'Real Estate',
    description: 'Asset-led sales that require lead qualification, inventory visibility and proposal follow-through.',
    keywords: ['property', 'listing', 'imovel', 'corretor', 'visita', 'proposal'],
    requiredDomains: ['sales', 'operations', 'digital', 'finance'],
    recommendedConnectors: ['crm', 'website_reader', 'manual_upload', 'financial'],
    kpis: [
      {
        key: 'visit_to_proposal_ratio',
        label: 'Visit to Proposal Ratio',
        domain: 'sales',
        outcome: 'revenue',
        description: 'Tracks whether showing activity turns into serious negotiation.'
      },
      {
        key: 'listing_health',
        label: 'Listing Health',
        domain: 'digital',
        outcome: 'revenue',
        description: 'Measures if property pages and assets support conversion.'
      }
    ],
    actionTemplates: [
      {
        title: 'Rank opportunities by readiness instead of lead volume',
        why: 'Real estate pipelines often look full while true buyer intent is concentrated in few accounts.',
        impact: 'revenue',
        horizon: 'now'
      }
    ]
  },
  manufacturing_b2b: {
    key: 'manufacturing_b2b',
    label: 'Manufacturing and B2B Operations',
    description: 'Operationally complex businesses that depend on product, supply, order and margin alignment.',
    keywords: ['factory', 'manufacturing', 'production', 'supply', 'inventory', 'distribution'],
    requiredDomains: ['operations', 'finance', 'sales', 'knowledge'],
    recommendedConnectors: ['erp', 'financial', 'crm', 'manual_upload'],
    kpis: [
      {
        key: 'quote_to_order_ratio',
        label: 'Quote to Order Ratio',
        domain: 'sales',
        outcome: 'revenue',
        description: 'Measures how commercial quoting performance converts into booked demand.'
      },
      {
        key: 'margin_under_pressure',
        label: 'Margin Under Pressure',
        domain: 'finance',
        outcome: 'risk',
        description: 'Shows where operational cost or pricing discipline is eroding profitability.'
      }
    ],
    actionTemplates: [
      {
        title: 'Unify quote, order and payment visibility',
        why: 'B2B manufacturers lose money when commercial and operational data drift apart.',
        impact: 'risk',
        horizon: 'now'
      }
    ]
  }
};

export class IndustryIntelligence {
  assess(entities: CanonicalEntity[], connectors: IntegrationRegistration[] = []): IndustryAssessment {
    const candidates = this.rankIndustries(entities, connectors);
    const primary = candidates[0]?.industry ?? 'general';
    const pack = INDUSTRY_PACKS[primary];
    const readiness = this.buildReadiness(entities, connectors, pack.requiredDomains);
    const businessMetrics = this.buildBusinessMetrics(entities);

    return {
      primaryIndustry: primary,
      label: pack.label,
      description: pack.description,
      confidence: scoreToConfidence(candidates[0]?.score ?? 0),
      candidates,
      signals: candidates[0]?.reasons ?? ['Insufficient vertical evidence. Falling back to general business pack.'],
      recommendedConnectors: this.recommendConnectors(connectors, pack.requiredDomains, pack.recommendedConnectors),
      readiness,
      kpis: pack.kpis,
      businessMetrics
    };
  }

  buildExecutionPlan(entities: CanonicalEntity[], connectors: IntegrationRegistration[] = []): TenantExecutionPlan {
    const assessment = this.assess(entities, connectors);
    const pack = INDUSTRY_PACKS[assessment.primaryIndustry];
    const missingDomains = assessment.readiness.missingDomains;
    const priorities = [...pack.actionTemplates];

    if (missingDomains.includes('finance')) {
      priorities.unshift({
        title: 'Connect financial truth before scaling automation',
        why: 'Without payment and financial records, the platform cannot measure revenue quality or risk exposure.',
        impact: 'risk',
        horizon: 'now'
      });
    }

    if (missingDomains.includes('sales')) {
      priorities.unshift({
        title: 'Connect CRM to expose demand quality',
        why: 'The system needs pipeline context to recommend next-best actions with commercial impact.',
        impact: 'revenue',
        horizon: 'now'
      });
    }

    if (assessment.readiness.overallScore >= 80) {
      priorities.unshift({
        title: 'Activate AI copilots with approval workflows',
        why: 'Data coverage is strong enough to move from insight-only to assisted execution.',
        impact: 'efficiency',
        horizon: 'next'
      });
    }

    return {
      primaryIndustry: assessment.primaryIndustry,
      readinessScore: assessment.readiness.overallScore,
      priorities: dedupePriorities(priorities).slice(0, 5),
      kpiFocus: assessment.kpis,
      connectorRecommendations: assessment.recommendedConnectors
    };
  }

  private rankIndustries(
    entities: CanonicalEntity[],
    connectors: IntegrationRegistration[]
  ): IndustryAssessmentCandidate[] {
    const joinedText = buildCorpus(entities, connectors);

    const candidates = Object.values(INDUSTRY_PACKS).map((pack) => {
      let score = pack.key === 'general' ? 1 : 0;
      const reasons: string[] = [];

      for (const entity of entities) {
        for (const hint of entity.industryHints ?? []) {
          if (hint === pack.key) {
            score += 3;
            reasons.push(`Entity ${entity.entityType} carried ${hint} hint from ${entity.source}.`);
          }
        }
      }

      for (const keyword of pack.keywords) {
        if (joinedText.includes(keyword)) {
          score += 1;
          reasons.push(`Keyword "${keyword}" detected in normalized context.`);
        }
      }

      const connectorMatches = connectors.filter((connector) =>
        pack.recommendedConnectors.includes(connector.sourceType)
      ).length;
      if (connectorMatches > 0) {
        score += connectorMatches * 0.75;
        reasons.push(`${connectorMatches} recommended connector(s) already linked for ${pack.label}.`);
      }

      return {
        industry: pack.key,
        label: pack.label,
        score: Number(score.toFixed(2)),
        reasons: uniqueStrings(reasons).slice(0, 5)
      };
    });

    return candidates.sort((left, right) => right.score - left.score).slice(0, 4);
  }

  private buildReadiness(
    entities: CanonicalEntity[],
    connectors: IntegrationRegistration[],
    requiredDomains: BusinessDomain[]
  ): DataReadinessReport {
    const domainCoverage = Object.fromEntries(
      DOMAIN_KEYS.map((domain) => {
        const entityCount = entities.filter((entity) => entity.domains?.includes(domain)).length;
        const connectorCount = connectors.filter((connector) =>
          (connector.domainCoverage ?? []).includes(domain)
        ).length;
        const rawScore = Math.min(100, entityCount * 12 + connectorCount * 20 + (requiredDomains.includes(domain) ? 10 : 0));

        return [
          domain,
          {
            present: entityCount > 0 || connectorCount > 0,
            entityCount,
            connectorCount,
            score: rawScore
          }
        ];
      })
    ) as DataReadinessReport['domainCoverage'];

    const missingDomains = DOMAIN_KEYS.filter((domain) => requiredDomains.includes(domain) && !domainCoverage[domain].present);
    const timestamps = entities
      .map((entity) => Date.parse(entity.updatedAt))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => right - left);
    const latestUpdate = timestamps[0];
    const freshnessScore = !latestUpdate
      ? 0
      : latestUpdate >= Date.now() - 1000 * 60 * 60 * 24 * 3
        ? 100
        : latestUpdate >= Date.now() - 1000 * 60 * 60 * 24 * 14
          ? 70
          : 35;

    const sourceBreadth = uniqueStrings(entities.map((entity) => entity.source)).length;
    const averageCoverage = Math.round(
      DOMAIN_KEYS.reduce((sum, domain) => sum + domainCoverage[domain].score, 0) / DOMAIN_KEYS.length
    );
    const overallScore = Math.max(
      0,
      Math.min(100, Math.round(averageCoverage * 0.7 + freshnessScore * 0.2 + Math.min(sourceBreadth, 6) * 5))
    );

    return {
      overallScore,
      freshnessScore,
      sourceBreadth,
      missingDomains,
      confidence: scoreToConfidence(overallScore / 10),
      domainCoverage
    };
  }

  private recommendConnectors(
    connectors: IntegrationRegistration[],
    requiredDomains: BusinessDomain[],
    recommendedConnectors: SourceConnectorType[]
  ): ConnectorRecommendation[] {
    const connectedTypes = new Set(connectors.map((connector) => connector.sourceType));
    const recommendations: ConnectorRecommendation[] = [];

    for (const connectorType of recommendedConnectors) {
      if (connectedTypes.has(connectorType)) continue;

      const domains = CONNECTOR_DOMAINS[connectorType];
      const critical = domains.some((domain) => requiredDomains.includes(domain));

      recommendations.push({
        connectorType,
        domain: domains[0] ?? 'knowledge',
        priority: critical ? 'high' : 'medium',
        reason: critical
          ? `Missing connector for required domain(s): ${domains.join(', ')}.`
          : `Useful to enrich contextual breadth in domain(s): ${domains.join(', ')}.`
      });
    }

    return recommendations.slice(0, 5);
  }

  private buildBusinessMetrics(entities: CanonicalEntity[]): BusinessMetricCard[] {
    const count = (type: CanonicalEntityType) => entities.filter((entity) => entity.entityType === type).length;
    const sum = (type: CanonicalEntityType, field: string) =>
      entities
        .filter((entity) => entity.entityType === type)
        .reduce(
          (total, entity) => total + Number((entity.attributes as Record<string, unknown>)[field] ?? 0),
          0
        );

    const leads = count('Lead');
    const orders = count('Order');
    const payments = count('Payment');
    const records = count('FinancialRecord');
    const socialPosts = count('SocialPost');
    const websitePages = count('WebsitePage');
    const capturedDemand = leads + orders;

    return [
      {
        key: 'commercial_surface',
        label: 'Commercial Surface',
        value: capturedDemand,
        unit: 'count',
        narrative: `Direct currently sees ${leads} leads and ${orders} orders in unified context.`
      },
      {
        key: 'revenue_signal',
        label: 'Revenue Signal',
        value: sum('Payment', 'amount') + sum('FinancialRecord', 'amount'),
        unit: 'currency',
        narrative: `Detected ${payments} payment events and ${records} financial records.`
      },
      {
        key: 'digital_signal',
        label: 'Digital Signal',
        value: websitePages + socialPosts,
        unit: 'count',
        narrative: `Detected ${websitePages} website pages and ${socialPosts} social posts.`
      },
      {
        key: 'order_conversion_ratio',
        label: 'Order Conversion Ratio',
        value: leads > 0 ? Number((orders / leads).toFixed(2)) : 0,
        unit: 'ratio',
        narrative: leads > 0 ? 'Orders are being compared against captured lead volume.' : 'Lead data is missing, so conversion is not measurable yet.'
      }
    ];
  }
}

export function getIndustryPack(industry: IndustryType) {
  return INDUSTRY_PACKS[industry];
}

function buildCorpus(entities: CanonicalEntity[], connectors: IntegrationRegistration[]) {
  return normalizeText(
    [
      ...entities.flatMap((entity) => [
        entity.entityType,
        ...(entity.industryHints ?? []),
        ...Object.values(entity.attributes).flatMap((value) =>
          Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value ?? '')]
        )
      ]),
      ...connectors.flatMap((connector) => [
        connector.sourceType,
        connector.displayName ?? '',
        ...(connector.capabilities ?? [])
      ])
    ].join(' ')
  ).toLowerCase();
}

function dedupePriorities<T extends { title: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function scoreToConfidence(score: number): 'low' | 'medium' | 'high' {
  if (score >= 8 || score >= 80) return 'high';
  if (score >= 4 || score >= 50) return 'medium';
  return 'low';
}
