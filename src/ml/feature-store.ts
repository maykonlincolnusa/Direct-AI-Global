import { CanonicalEntity } from '../models/canonical';

export interface FeatureSnapshot {
  tenantId: string;
  generatedAt: string;
  totals: Record<string, number>;
  ratios: {
    leadToOrder: number;
    paymentCoverage: number;
    digitalToLead: number;
  };
}

export class FeatureStore {
  buildSnapshot(tenantId: string, entities: CanonicalEntity[]): FeatureSnapshot {
    const totals = countByType(entities);
    const leadCount = totals.Lead ?? 0;
    const orderCount = totals.Order ?? 0;
    const paymentCount = totals.Payment ?? 0;
    const digitalCount = (totals.WebsitePage ?? 0) + (totals.SocialPost ?? 0);

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      totals,
      ratios: {
        leadToOrder: safeDivide(leadCount, orderCount || 1),
        paymentCoverage: safeDivide(paymentCount, orderCount || 1),
        digitalToLead: safeDivide(digitalCount, leadCount || 1)
      }
    };
  }
}

function countByType(entities: CanonicalEntity[]) {
  const totals: Record<string, number> = {};
  for (const entity of entities) {
    totals[entity.entityType] = (totals[entity.entityType] ?? 0) + 1;
  }
  return totals;
}

function safeDivide(numerator: number, denominator: number) {
  return Number((numerator / denominator).toFixed(4));
}
