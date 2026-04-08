import { z } from 'zod';

export const authPayloadSchema = z.object({
  tenantId: z.string().min(1).default('public'),
  userId: z.string().min(1).default('anonymous'),
  roles: z.array(z.string()).default(['user']),
  attributes: z.record(z.string(), z.unknown()).default({}),
  tokenBudget: z
    .object({
      request: z.number().default(800),
      perUser: z.number().default(3000),
      perTenant: z.number().default(25000),
      perModule: z.number().default(5000)
    })
    .default({
      request: 800,
      perUser: 3000,
      perTenant: 25000,
      perModule: 5000
    })
});

export type AuthContext = z.infer<typeof authPayloadSchema>;

type BudgetContext = {
  tenantId: string;
  userId: string;
  moduleKey: string;
  requestedTokens: number;
  limits?: {
    perRequest?: number;
    perUser?: number;
    perTenant?: number;
    perModule?: number;
  };
};

export class TokenBudgetManager {
  private tracker = new Map<string, number>();

  constructor(private readonly defaults = { perRequest: 1000, perUser: 5000, perTenant: 50000, perModule: 10000 }) {}

  ensureBudget(tenantId: string, moduleKey: string, requestedTokens: number, overrideLimit?: number) {
    const key = `${tenantId}:${moduleKey}`;
    const limit = overrideLimit ?? this.defaults.perModule;
    const consumed = this.tracker.get(key) ?? 0;

    if (consumed + requestedTokens > limit) {
      throw new Error('token budget exceeded');
    }

    this.tracker.set(key, consumed + requestedTokens);
    return { remaining: limit - (consumed + requestedTokens), limit };
  }

  ensureCompositeBudget(context: BudgetContext) {
    const limits = {
      perRequest: context.limits?.perRequest ?? this.defaults.perRequest,
      perUser: context.limits?.perUser ?? this.defaults.perUser,
      perTenant: context.limits?.perTenant ?? this.defaults.perTenant,
      perModule: context.limits?.perModule ?? this.defaults.perModule
    };

    if (context.requestedTokens > limits.perRequest) {
      throw new Error('per-request token budget exceeded');
    }

    const userKey = `user:${context.tenantId}:${context.userId}`;
    const tenantKey = `tenant:${context.tenantId}`;
    const moduleKey = `module:${context.tenantId}:${context.moduleKey}`;
    const userUsed = this.tracker.get(userKey) ?? 0;
    const tenantUsed = this.tracker.get(tenantKey) ?? 0;
    const moduleUsed = this.tracker.get(moduleKey) ?? 0;

    if (userUsed + context.requestedTokens > limits.perUser) {
      throw new Error('per-user token budget exceeded');
    }
    if (tenantUsed + context.requestedTokens > limits.perTenant) {
      throw new Error('per-tenant token budget exceeded');
    }
    if (moduleUsed + context.requestedTokens > limits.perModule) {
      throw new Error('per-module token budget exceeded');
    }

    this.tracker.set(userKey, userUsed + context.requestedTokens);
    this.tracker.set(tenantKey, tenantUsed + context.requestedTokens);
    this.tracker.set(moduleKey, moduleUsed + context.requestedTokens);

    return {
      userRemaining: limits.perUser - (userUsed + context.requestedTokens),
      tenantRemaining: limits.perTenant - (tenantUsed + context.requestedTokens),
      moduleRemaining: limits.perModule - (moduleUsed + context.requestedTokens)
    };
  }

  getConsumption(tenantId: string, moduleKey: string) {
    return this.tracker.get(`${tenantId}:${moduleKey}`) ?? 0;
  }

  reset(tenantId: string, moduleKey: string) {
    this.tracker.delete(`${tenantId}:${moduleKey}`);
  }
}

export class AuthPolicy {
  constructor(private allowedRoles: string[] = ['admin', 'user']) {}

  permits(context: AuthContext) {
    return context.roles.some((role) => this.allowedRoles.includes(role));
  }

  requiresRole(role: string) {
    return (context: AuthContext) => context.roles.includes(role);
  }

  allowsTenant(context: AuthContext, tenantId: string) {
    if (context.roles.includes('admin')) return true;
    return context.tenantId === tenantId;
  }

  allowsAttribute(context: AuthContext, attribute: string, value: unknown) {
    if (context.roles.includes('admin')) return true;
    return context.attributes[attribute] === value;
  }
}
