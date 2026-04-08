export interface IARequestContext {
  tenantId: string;
  userId: string;
  module: string;
  prompt: string;
  tokens: number;
  sessionId: string;
  budget?: number;
  model?: string;
}

type SessionTurn = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: string;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class SessionMemory {
  private store = new Map<string, SessionTurn[]>();

  remember(sessionId: string, content: string, role: SessionTurn['role'] = 'assistant') {
    const current = this.store.get(sessionId) ?? [];
    current.push({
      role,
      content,
      at: new Date().toISOString()
    });
    this.store.set(sessionId, current.slice(-20));
  }

  recall(sessionId: string) {
    return (this.store.get(sessionId) ?? [])
      .map((turn) => `${turn.role}: ${turn.content}`)
      .join('\n');
  }

  summarize(sessionId: string, maxChars = 500) {
    const content = this.recall(sessionId);
    if (!content) return '';
    return content.length <= maxChars ? content : `${content.slice(0, maxChars)}...`;
  }
}

export class IAUsageTracker {
  private usageByModule = new Map<string, number>();
  private usageByUser = new Map<string, number>();
  private usageByTenant = new Map<string, number>();
  private totalCostByTenant = new Map<string, number>();

  track(request: IARequestContext, pricePer1KTokens = 0) {
    const moduleKey = `${request.tenantId}:${request.module}`;
    const userKey = `${request.tenantId}:${request.userId}`;
    const tenantKey = `${request.tenantId}`;
    const modelCost = (request.tokens / 1000) * pricePer1KTokens;

    this.usageByModule.set(moduleKey, (this.usageByModule.get(moduleKey) ?? 0) + request.tokens);
    this.usageByUser.set(userKey, (this.usageByUser.get(userKey) ?? 0) + request.tokens);
    this.usageByTenant.set(tenantKey, (this.usageByTenant.get(tenantKey) ?? 0) + request.tokens);
    this.totalCostByTenant.set(
      tenantKey,
      Number(((this.totalCostByTenant.get(tenantKey) ?? 0) + modelCost).toFixed(6))
    );

    return {
      module: this.usageByModule.get(moduleKey) ?? 0,
      user: this.usageByUser.get(userKey) ?? 0,
      tenant: this.usageByTenant.get(tenantKey) ?? 0,
      tenantCost: this.totalCostByTenant.get(tenantKey) ?? 0
    };
  }

  snapshot(tenantId?: string) {
    const modules = [...this.usageByModule.entries()]
      .filter(([key]) => (tenantId ? key.startsWith(`${tenantId}:`) : true))
      .map(([key, tokens]) => ({ key, tokens }));

    const users = [...this.usageByUser.entries()]
      .filter(([key]) => (tenantId ? key.startsWith(`${tenantId}:`) : true))
      .map(([key, tokens]) => ({ key, tokens }));

    const tenants = [...this.usageByTenant.entries()]
      .filter(([key]) => (tenantId ? key === tenantId : true))
      .map(([key, tokens]) => ({
        key,
        tokens,
        cost: this.totalCostByTenant.get(key) ?? 0
      }));

    return { modules, users, tenants };
  }

  reset() {
    this.usageByModule.clear();
    this.usageByUser.clear();
    this.usageByTenant.clear();
    this.totalCostByTenant.clear();
  }
}

export class IAResponseCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();

  get(key: string) {
    const current = this.store.get(key);
    if (!current) return null;
    if (current.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return current.value;
  }

  set(key: string, value: T, ttlSeconds: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

export class ModelFallbackStrategy {
  constructor(private readonly models: string[]) {}

  pick(primary?: string) {
    if (primary && this.models.includes(primary)) return primary;
    return this.models[0] ?? 'default-model';
  }

  fallback(current: string) {
    const index = this.models.indexOf(current);
    if (index < 0 || index + 1 >= this.models.length) {
      return current;
    }
    return this.models[index + 1];
  }
}

export function shouldUseShortResponse(context: IARequestContext, threshold = 1200) {
  if (context.tokens > threshold) return true;
  if ((context.budget ?? 0) < context.tokens) return true;
  return false;
}
