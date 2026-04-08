import type { AuthContext } from '@direct/shared-auth';
import type { resolveTenant, TenantProfile } from '@direct/shared-tenant';
import type { BillingEvent, UsageEvent, calculateBilling, deriveBillingEvent } from '@direct/shared-billing';
import type { ObservabilityBridge, ObservabilityContext } from '@direct/shared-observability';
import type { IAResponseCache, IAUsageTracker, ModelFallbackStrategy, SessionMemory as IAStorage, shouldUseShortResponse } from '@direct/shared-ia';
import type { EventBus } from '../shared/events.js';
import type { FeatureFlagRegistry } from '../shared/feature-flags.js';
import type { StorageGateway } from '../shared/storage.js';

declare module 'fastify' {
  interface FastifyRequest {
    authContext: AuthContext;
    tenantProfile?: TenantProfile;
    observabilityContext?: ObservabilityContext;
    iaSessionId?: string;
  }

  interface FastifyInstance {
    tokenBudget: import('@direct/shared-auth').TokenBudgetManager;
    authenticate: (request: FastifyRequest) => Promise<AuthContext>;
    tenantResolver: typeof resolveTenant;
    billing: {
      estimate: (planId: string, params: Parameters<typeof calculateBilling>[1]) => ReturnType<typeof calculateBilling>;
      derive: (event: BillingEvent) => ReturnType<typeof deriveBillingEvent>;
      trackUsage: (event: UsageEvent) => ReturnType<import('@direct/shared-billing').BillingUsageTracker['track']>;
      usageSnapshot: (tenantId?: string) => ReturnType<import('@direct/shared-billing').BillingUsageTracker['snapshot']>;
      estimateUsageCharge: (tenantId: string) => ReturnType<import('@direct/shared-billing').BillingUsageTracker['estimateUsageCharge']>;
    };
    observability: ObservabilityBridge;
    ia: {
      tracker: IAUsageTracker;
      memory: IAStorage;
      cache: IAResponseCache<{ answer: string; model: string }>;
      modelFallback: ModelFallbackStrategy;
      shouldShortResponse: typeof shouldUseShortResponse;
    };
    eventBus: EventBus;
    featureFlags: FeatureFlagRegistry;
    storage: StorageGateway;
  }
}
