import { FastifyPluginAsync } from 'fastify';
import { config } from '@direct/config';
import { createObservabilityContext, ObservabilityBridge } from '@direct/shared-observability';

export const observabilityPlugin: FastifyPluginAsync = async (fastify) => {
  const bridge = new ObservabilityBridge({
    otelEnabled: config.OTEL_ENABLED,
    otelEndpoint: config.OTEL_EXPORTER_OTLP_ENDPOINT,
    serviceName: config.OTEL_SERVICE_NAME
  });

  fastify.decorate('observability', bridge);

  fastify.addHook('onRequest', async (request, reply) => {
    const moduleSegment = request.url.split('/')[2];
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ??
      (request.headers['x-correlation-id'] as string | undefined) ??
      request.id;
    const traceId =
      (request.headers['x-trace-id'] as string | undefined) ??
      (request.headers['traceparent'] as string | undefined);
    const context = createObservabilityContext({
      requestId,
      traceId,
      tenantId: request.headers['x-tenant-id'] as string | undefined,
      module: moduleSegment ?? 'core',
      method: request.method,
      path: request.url
    });

    request.observabilityContext = context;
    reply.header('x-request-id', context.requestId);
    reply.header('x-correlation-id', context.requestId);
    if (context.traceId) {
      reply.header('x-trace-id', context.traceId);
    }

    bridge.capture('http.request.received', 1, context);
  });

  fastify.addHook('onResponse', async (request, reply) => {
    if (!request.observabilityContext) return;
    bridge.capture(`http.response.${reply.statusCode}`, 1, request.observabilityContext);
  });

  fastify.addHook('onError', async (request, _reply, error) => {
    if (!request.observabilityContext) return;
    bridge.captureError(error, request.observabilityContext);
  });

  fastify.get('/metrics', async () => {
    return bridge.snapshot();
  });
};
