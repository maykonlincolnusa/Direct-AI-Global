import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import mongodb from '@fastify/mongodb';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { config } from '@direct/config';
import { logger } from '@direct/logger';
import { authPlugin } from './shared/auth.js';
import { billingPlugin } from './shared/billing.js';
import { iaPlugin } from './shared/ia.js';
import { observabilityPlugin } from './shared/observability.js';
import { featureFlagsPlugin } from './shared/feature-flags.js';
import { eventsPlugin } from './shared/events.js';
import { storagePlugin } from './shared/storage.js';
import { securityPlugin } from './shared/security.js';
import { tenantPlugin } from './shared/tenant.js';
import modules, { moduleDefinitions } from './modules/index.js';
import { formatLocalCurrency, getLocaleForRequest } from './shared/globalization.js';

const fastify = Fastify({
  bodyLimit: config.REQUEST_BODY_LIMIT,
  trustProxy: config.TRUST_PROXY,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  logger: {
    level: config.LOG_LEVEL,
    transport:
      config.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true }
          }
        : undefined
  }
});

async function bootstrap() {
  await fastify.register(cors, {
    origin: config.CORS_ORIGINS === '*' ? true : config.CORS_ORIGINS.split(',').map((entry) => entry.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  });
  await fastify.register(helmet);
  await fastify.register(sensible as any);
  await fastify.register(rateLimit as any, {
    max: config.RATE_LIMIT_POINTS,
    timeWindow: config.RATE_LIMIT_WINDOW_MS
  });
  await fastify.register(jwt, { secret: config.JWT_SECRET });
  await fastify.register(mongodb as any, {
    url: config.MONGO_URI,
    forceClose: true
  });

  await fastify.register(observabilityPlugin);
  await fastify.register(securityPlugin);
  await fastify.register(authPlugin);
  await fastify.register(tenantPlugin);
  await fastify.register(eventsPlugin);
  await fastify.register(storagePlugin);
  await fastify.register(featureFlagsPlugin);
  await fastify.register(billingPlugin);
  await fastify.register(iaPlugin);

  fastify.get('/health', async () => ({
    status: 'ok',
    service: config.APP_NAME,
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    provider: config.CLOUD_PROVIDER,
    region: config.APP_REGION
  }));

  fastify.get('/ready', async () => ({
    status: 'ready',
    dependencies: {
      mongo: Boolean(fastify.mongo?.client),
      redis: Boolean(config.REDIS_URL),
      queue: Boolean(config.RABBITMQ_URL)
    }
  }));

  fastify.get('/live', async () => ({
    status: 'live'
  }));

  fastify.get('/', async (request) => ({
    status: 'Direct Platform ready',
    provider: config.CLOUD_PROVIDER,
    locale: getLocaleForRequest(request),
    currencyExample: formatLocalCurrency(1000, config.DEFAULT_CURRENCY, getLocaleForRequest(request)),
    modules: moduleDefinitions.map((definition) => ({
      name: definition.name,
      prefix: definition.prefix,
      description: definition.description,
      billing: definition.billing
    }))
  }));

  fastify.get('/v1/gateway/status', async (request) => ({
    status: 'ok',
    requestId: request.observabilityContext?.requestId ?? request.id,
    provider: config.CLOUD_PROVIDER,
    region: config.APP_REGION,
    modules: moduleDefinitions.length
  }));

  fastify.get('/v1/gateway/routes', async () => ({
    basePath: '/v1',
    auth: ['/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout', '/v1/auth/me'],
    modules: moduleDefinitions.map((definition) => ({
      key: definition.key,
      prefix: `/v1${definition.prefix}`,
      commands: definition.backEnd.commands
    }))
  }));

  await fastify.register(modules, { prefix: '/v1' });

  await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  logger.info(`Platform API listening on http://0.0.0.0:${config.PORT}`);
}

bootstrap().catch((error) => {
  logger.error(error);
  process.exit(1);
});
