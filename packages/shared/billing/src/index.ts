import { z } from 'zod';

export const billingPlanSchema = z.object({
  id: z.string(),
  modules: z.array(z.string()),
  monthly: z.number(),
  annual: z.number(),
  currency: z.string(),
  description: z.string(),
  includeIA: z.boolean().default(false),
  tokenMultiplier: z.number().default(1)
});

export type BillingPlan = z.infer<typeof billingPlanSchema>;

export const planMatrix: BillingPlan[] = [
  billingPlanSchema.parse({
    id: 'starter',
    modules: ['core'],
    monthly: 249,
    annual: 2490,
    currency: 'USD',
    description: 'Core platform plus tenant essentials',
    includeIA: false,
    tokenMultiplier: 1
  }),
  billingPlanSchema.parse({
    id: 'growth',
    modules: ['core', 'sales', 'finance', 'crm'],
    monthly: 899,
    annual: 8990,
    currency: 'USD',
    description: 'Revenue and Finance stack for scaling teams',
    includeIA: true,
    tokenMultiplier: 2
  }),
  billingPlanSchema.parse({
    id: 'enterprise',
    modules: ['core', 'sales', 'finance', 'crm', 'people', 'sites', 'academy', 'insight', 'automate', 'local', 'ai'],
    monthly: 1899,
    annual: 18990,
    currency: 'USD',
    description: 'Full Direct stack with automation and insight',
    includeIA: true,
    tokenMultiplier: 3
  })
];

export type AddOnCharge = {
  id: string;
  description: string;
  unitPrice: number;
  unit: 'token' | 'execution' | 'seat' | 'request';
};

export const iaAddOns: AddOnCharge[] = [
  { id: 'ai-tokens', description: 'LLM tokens consumed', unitPrice: 0.000002, unit: 'token' },
  {
    id: 'automation-executions',
    description: 'Automation workflow execution',
    unitPrice: 0.03,
    unit: 'execution'
  },
  { id: 'premium-support-seat', description: 'Premium support seat', unitPrice: 49, unit: 'seat' }
];

export function calculateBilling(
  planId: string,
  options: { addons?: string[]; region?: string; units?: number; annual?: boolean }
) {
  const plan = planMatrix.find((p) => p.id === planId) ?? planMatrix[0];
  const base = options.annual ? plan.annual : plan.monthly;
  const addonTotal = (options.addons ?? [])
    .map((addonId) => iaAddOns.find((addon) => addon.id === addonId))
    .filter(Boolean)
    .map((addon) => addon!.unitPrice)
    .reduce((acc, value) => acc + value, 0);
  const usage = (options.units ?? 0) * 0.001 * plan.tokenMultiplier;
  const multiplier = regionMultipliers[options.region ?? 'US'] ?? 1;

  return {
    total: +(base * multiplier + addonTotal + usage).toFixed(2),
    currency: plan.currency
  };
}

const regionMultipliers: Record<string, number> = {
  BR: 1.1,
  LATAM: 1.05,
  US: 1,
  EU: 1.12,
  APAC: 1.08
};

export type BillingEvent = {
  tenantId: string;
  event: 'plan.changed' | 'billing.issued' | 'payment.received' | 'usage.overage' | 'usage.tracked';
  payload: Record<string, unknown>;
};

export type UsageEvent = {
  tenantId: string;
  module: string;
  metric: 'tokens' | 'automations' | 'requests';
  amount: number;
  at?: string;
};

export class BillingUsageTracker {
  private readonly usage = new Map<string, { tokens: number; automations: number; requests: number }>();

  track(event: UsageEvent) {
    const key = `${event.tenantId}:${event.module}`;
    const current = this.usage.get(key) ?? { tokens: 0, automations: 0, requests: 0 };
    current[event.metric] += event.amount;
    this.usage.set(key, current);
    return {
      key,
      totals: { ...current }
    };
  }

  snapshot(tenantId?: string) {
    const entries = [...this.usage.entries()];
    return entries
      .filter(([key]) => (tenantId ? key.startsWith(`${tenantId}:`) : true))
      .map(([key, totals]) => ({ key, totals }));
  }

  estimateUsageCharge(tenantId: string) {
    const rows = this.snapshot(tenantId);
    let total = 0;

    for (const row of rows) {
      total += row.totals.tokens * getUnitPrice('ai-tokens');
      total += row.totals.automations * getUnitPrice('automation-executions');
    }

    return {
      tenantId,
      total: Number(total.toFixed(4)),
      currency: 'USD',
      rows
    };
  }
}

export function deriveBillingEvent(event: BillingEvent) {
  return {
    ...event,
    timestamp: new Date().toISOString(),
    enriched: {
      currency: planMatrix.find((plan) => plan.modules.includes('core'))?.currency ?? 'USD'
    }
  };
}

function getUnitPrice(addOnId: string) {
  return iaAddOns.find((addOn) => addOn.id === addOnId)?.unitPrice ?? 0;
}
