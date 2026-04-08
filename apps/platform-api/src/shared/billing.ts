import { FastifyPluginAsync } from 'fastify';
import {
  BillingEvent,
  BillingUsageTracker,
  UsageEvent,
  calculateBilling,
  deriveBillingEvent
} from '@direct/shared-billing';
import { z } from 'zod';

const usageSchema = z.object({
  tenantId: z.string().min(1),
  module: z.string().min(1),
  metric: z.enum(['tokens', 'automations', 'requests']),
  amount: z.number().positive()
});

export const billingPlugin: FastifyPluginAsync = async (fastify) => {
  const usageTracker = new BillingUsageTracker();

  fastify.decorate('billing', {
    estimate(planId: string, params: Parameters<typeof calculateBilling>[1]) {
      return calculateBilling(planId, params);
    },
    derive(event: BillingEvent) {
      return deriveBillingEvent(event);
    },
    trackUsage(event: UsageEvent) {
      return usageTracker.track(event);
    },
    usageSnapshot(tenantId?: string) {
      return usageTracker.snapshot(tenantId);
    },
    estimateUsageCharge(tenantId: string) {
      return usageTracker.estimateUsageCharge(tenantId);
    }
  });

  fastify.post('/v1/core/billing/usage', async (request, reply) => {
    const payload = usageSchema.parse(request.body ?? {});
    const tracked = fastify.billing.trackUsage(payload);
    await fastify.eventBus.publish({
      topic: 'billing.usage.tracked',
      tenantId: payload.tenantId,
      payload: tracked,
      maxRetries: 3,
      idempotencyKey: `${payload.tenantId}:${payload.module}:${payload.metric}:${Date.now()}`
    });
    reply.status(202).send({
      status: 'tracked',
      tracked
    });
  });

  fastify.get('/v1/core/billing/usage/:tenantId', async (request) => {
    const tenantId = (request.params as { tenantId: string }).tenantId;
    return {
      tenantId,
      snapshot: fastify.billing.usageSnapshot(tenantId),
      estimate: fastify.billing.estimateUsageCharge(tenantId)
    };
  });
};
