import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '@direct/config';
import { randomUUID } from 'node:crypto';

const publishSchema = z.object({
  topic: z.string().min(1),
  tenantId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3)
});

type EventMessage = z.infer<typeof publishSchema> & {
  id: string;
  attempts: number;
  createdAt: string;
  lastError?: string;
};

type EventHandler = (event: EventMessage) => Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private dlq: EventMessage[] = [];
  private idempotency = new Set<string>();

  constructor(private readonly defaults: { maxRetries: number; baseDelayMs: number }) {}

  register(topic: string, handler: EventHandler) {
    const current = this.handlers.get(topic) ?? [];
    current.push(handler);
    this.handlers.set(topic, current);
  }

  async publish(event: Omit<EventMessage, 'id' | 'attempts' | 'createdAt'>) {
    if (event.idempotencyKey && this.idempotency.has(event.idempotencyKey)) {
      return { status: 'deduplicated' as const };
    }
    if (event.idempotencyKey) {
      this.idempotency.add(event.idempotencyKey);
    }

    const message: EventMessage = {
      ...event,
      id: randomUUID(),
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    await this.dispatch(message);
    return { status: 'published' as const, id: message.id };
  }

  listDlq() {
    return [...this.dlq];
  }

  snapshot() {
    return {
      handlers: [...this.handlers.entries()].map(([topic, handlers]) => ({
        topic,
        handlers: handlers.length
      })),
      dlqSize: this.dlq.length
    };
  }

  private async dispatch(event: EventMessage): Promise<void> {
    const handlers = this.handlers.get(event.topic) ?? [];
    if (handlers.length === 0) {
      return;
    }

    for (const handler of handlers) {
      let delivered = false;
      let attempt = 0;
      const maxRetries = event.maxRetries ?? this.defaults.maxRetries;

      while (!delivered && attempt <= maxRetries) {
        try {
          attempt += 1;
          await handler({ ...event, attempts: attempt });
          delivered = true;
        } catch (error) {
          if (attempt > maxRetries) {
            this.dlq.push({
              ...event,
              attempts: attempt,
              lastError: error instanceof Error ? error.message : 'unknown handler error'
            });
            break;
          }
          await sleep(this.defaults.baseDelayMs * attempt);
        }
      }
    }
  }
}

export const eventsPlugin: FastifyPluginAsync = async (fastify) => {
  const eventBus = new EventBus({
    maxRetries: config.RETRY_MAX_ATTEMPTS,
    baseDelayMs: config.RETRY_BASE_DELAY_MS
  });

  fastify.decorate('eventBus', eventBus);

  eventBus.register('billing.usage.tracked', async () => {
    // default handler placeholder
  });
  eventBus.register('ia.tokens.overage', async () => {
    // default handler placeholder
  });

  fastify.post('/v1/core/events/publish', async (request, reply) => {
    const payload = publishSchema.parse(request.body ?? {});
    const result = await eventBus.publish(payload);
    reply.status(202).send({
      broker: config.RABBITMQ_URL,
      ...result
    });
  });

  fastify.get('/v1/core/events/dlq', async () => {
    return {
      items: eventBus.listDlq()
    };
  });

  fastify.get('/v1/core/events/metrics', async () => {
    return eventBus.snapshot();
  });
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
