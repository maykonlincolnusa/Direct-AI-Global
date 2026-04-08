import { FastifyPluginAsync } from 'fastify';
import {
  IARequestContext,
  IAResponseCache,
  IAUsageTracker,
  ModelFallbackStrategy,
  SessionMemory,
  shouldUseShortResponse
} from '@direct/shared-ia';
import { config } from '@direct/config';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const usageSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  module: z.string().min(1),
  tokens: z.number().positive(),
  sessionId: z.string().min(1),
  prompt: z.string().default(''),
  model: z.string().optional(),
  budget: z.number().optional()
});

export const iaPlugin: FastifyPluginAsync = async (fastify) => {
  const tracker = new IAUsageTracker();
  const memory = new SessionMemory();
  const cache = new IAResponseCache<{ answer: string; model: string }>();
  const fallback = new ModelFallbackStrategy(
    [
      process.env.OPENROUTER_MODEL ?? 'openai/gpt-oss-120b:free',
      process.env.OPENROUTER_FALLBACK_MODEL ?? 'openai/gpt-4o-mini'
    ].filter(Boolean)
  );

  fastify.decorate('ia', {
    tracker,
    memory,
    cache,
    modelFallback: fallback,
    shouldShortResponse: shouldUseShortResponse
  });

  fastify.post('/v1/core/ia/usage', async (request, reply) => {
    const payload = usageSchema.parse(request.body ?? {});
    const selectedModel = fallback.pick(payload.model);
    const usage = tracker.track(payload as IARequestContext, getModelUnitPrice(selectedModel));
    await fastify.eventBus.publish({
      topic: 'ia.tokens.overage',
      tenantId: payload.tenantId,
      payload: {
        ...usage,
        model: selectedModel
      },
      idempotencyKey: hashKey(`${payload.tenantId}:${payload.userId}:${payload.module}:${Date.now()}`),
      maxRetries: 3
    });

    reply.status(202).send({
      model: selectedModel,
      usage,
      shortResponse: shouldUseShortResponse(payload as IARequestContext, config.TOKEN_BUDGET_BASE)
    });
  });

  fastify.post('/v1/core/ia/cache', async (request, reply) => {
    const body = (request.body as Record<string, unknown> | undefined) ?? {};
    const key = hashKey(JSON.stringify(body.key ?? body.prompt ?? ''));
    const value = body.value as { answer: string; model: string };
    if (!value || typeof value.answer !== 'string') {
      reply.status(400).send({ message: 'invalid cache payload' });
      return;
    }
    const ttl = Number(body.ttlSeconds ?? 300);
    cache.set(key, value, ttl);
    reply.status(201).send({ key, ttlSeconds: ttl });
  });

  fastify.get('/v1/core/ia/cache/:key', async (request, reply) => {
    const key = (request.params as { key: string }).key;
    const value = cache.get(key);
    if (!value) {
      reply.status(404).send({ message: 'cache miss' });
      return;
    }
    reply.send({ key, value });
  });

  fastify.get('/v1/core/ia/usage/:tenantId', async (request) => {
    const tenantId = (request.params as { tenantId: string }).tenantId;
    return tracker.snapshot(tenantId);
  });
};

function getModelUnitPrice(model: string) {
  if (model.includes('gpt-4')) return 0.02;
  if (model.includes('gpt-oss')) return 0.004;
  return 0.006;
}

function hashKey(input: string) {
  return createHash('sha256').update(input).digest('hex');
}
