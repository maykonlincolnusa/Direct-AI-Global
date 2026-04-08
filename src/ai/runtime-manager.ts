import { hashString } from '../utils/id';
import { estimateTokens } from '../utils/text';
import { RuntimeStateStore } from './runtime-state-store';

export interface AskRequestContext {
  tenantId: string;
  module?: string;
  userId?: string;
  sessionId?: string;
  prompt: string;
  requestedTokens?: number;
}

export interface RuntimeBudgetPolicy {
  requestLimit: number;
  perUserLimit: number;
  perTenantLimit: number;
  perModuleLimit: number;
  shortResponseThreshold: number;
  cacheTtlSeconds: number;
  sessionTtlSeconds: number;
  counterTtlSeconds: number;
}

export interface BudgetCheckResult {
  requestedTokens: number;
  shortResponse: boolean;
  remaining: {
    user: number;
    tenant: number;
    module: number;
  };
}

const DEFAULT_POLICY: RuntimeBudgetPolicy = {
  requestLimit: 900,
  perUserLimit: 3_000,
  perTenantLimit: 25_000,
  perModuleLimit: 5_000,
  shortResponseThreshold: 1_200,
  cacheTtlSeconds: 600,
  sessionTtlSeconds: 60 * 60 * 24,
  counterTtlSeconds: 60 * 60 * 24
};

export class AIRuntimeManager {
  private readonly store: RuntimeStateStore;
  private readonly policy: RuntimeBudgetPolicy;

  constructor(policy: Partial<RuntimeBudgetPolicy> = {}, store = new RuntimeStateStore()) {
    this.policy = {
      ...DEFAULT_POLICY,
      ...policy
    };
    this.store = store;
  }

  async ensureBudget(context: AskRequestContext): Promise<BudgetCheckResult> {
    const requestedTokens = context.requestedTokens ?? estimateTokens(context.prompt);
    if (requestedTokens > this.policy.requestLimit) {
      throw new Error(`token request limit exceeded: ${requestedTokens}/${this.policy.requestLimit}`);
    }

    const moduleKey = context.module ?? 'general';
    const userKey = context.userId ?? 'anonymous';
    const [currentUser, currentTenant, currentModule] = await Promise.all([
      this.store.getCounter(`usage:user:${context.tenantId}:${userKey}`),
      this.store.getCounter(`usage:tenant:${context.tenantId}`),
      this.store.getCounter(`usage:module:${context.tenantId}:${moduleKey}`)
    ]);

    assertLimit(currentUser, requestedTokens, this.policy.perUserLimit, 'per-user');
    assertLimit(currentTenant, requestedTokens, this.policy.perTenantLimit, 'per-tenant');
    assertLimit(currentModule, requestedTokens, this.policy.perModuleLimit, 'per-module');

    const [nextUser, nextTenant, nextModule] = await Promise.all([
      this.store.increment(`usage:user:${context.tenantId}:${userKey}`, requestedTokens, this.policy.counterTtlSeconds),
      this.store.increment(`usage:tenant:${context.tenantId}`, requestedTokens, this.policy.counterTtlSeconds),
      this.store.increment(`usage:module:${context.tenantId}:${moduleKey}`, requestedTokens, this.policy.counterTtlSeconds)
    ]);

    return {
      requestedTokens,
      shortResponse:
        requestedTokens > this.policy.shortResponseThreshold ||
        nextTenant > this.policy.perTenantLimit * 0.8,
      remaining: {
        user: Math.max(0, this.policy.perUserLimit - nextUser),
        tenant: Math.max(0, this.policy.perTenantLimit - nextTenant),
        module: Math.max(0, this.policy.perModuleLimit - nextModule)
      }
    };
  }

  async rememberTurn(sessionId: string | undefined, role: 'user' | 'assistant', content: string) {
    if (!sessionId) return;
    await this.store.appendList(
      `session:${sessionId}`,
      JSON.stringify({
        role,
        content,
        at: new Date().toISOString()
      }),
      this.policy.sessionTtlSeconds
    );
  }

  async summarizeSession(sessionId: string | undefined, maxChars = 1_200) {
    if (!sessionId) return '';
    const entries = await this.store.getList(`session:${sessionId}`, 0, -1);
    if (entries.length === 0) return '';

    const merged = entries
      .slice(-8)
      .map((entry) => {
        try {
          const parsed = JSON.parse(entry) as { role: string; content: string };
          return `${parsed.role}: ${parsed.content}`;
        } catch {
          return entry;
        }
      })
      .join('\n');

    return merged.length <= maxChars ? merged : `${merged.slice(0, maxChars)}...`;
  }

  async getCachedAnswer(key: string) {
    const cached = await this.store.getString(`cache:${key}`);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async cacheAnswer(key: string, payload: unknown) {
    await this.store.setString(
      `cache:${key}`,
      JSON.stringify(payload),
      this.policy.cacheTtlSeconds
    );
  }

  buildCacheKey(context: AskRequestContext, retrievalSignature: string) {
    return hashString(
      JSON.stringify({
        tenantId: context.tenantId,
        module: context.module ?? 'general',
        prompt: context.prompt,
        retrievalSignature
      })
    );
  }
}

function assertLimit(current: number, requested: number, limit: number, label: string) {
  if (current + requested > limit) {
    throw new Error(`${label} token budget exceeded`);
  }
}
