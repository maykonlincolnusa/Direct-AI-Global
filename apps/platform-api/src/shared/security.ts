import type { FastifyPluginAsync } from 'fastify';
import { config } from '@direct/config';

export const securityPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preValidation', async (request) => {
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizePayload(request.body as Record<string, unknown>);
    }
  });

  fastify.addHook('preHandler', async (request, reply) => {
    const raw = request.raw;
    const contentLength = Number(raw.headers['content-length'] ?? 0);
    if (Number.isFinite(contentLength) && contentLength > config.REQUEST_BODY_LIMIT) {
      return reply.status(413).send({
        error: 'payload_too_large',
        message: `request body exceeds limit ${config.REQUEST_BODY_LIMIT}`
      });
    }
  });

  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const context = request.observabilityContext;

    if (context) {
      fastify.observability.captureError(error, context);
    }

    const payload = {
      error: statusCode >= 500 ? 'internal_error' : 'request_error',
      message: statusCode >= 500 ? 'Internal server error' : (error as Error).message,
      requestId: context?.requestId ?? request.id
    };

    reply.status(statusCode).send(payload);
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'not_found',
      message: `Route ${request.method} ${request.url} not found`,
      requestId: request.observabilityContext?.requestId ?? request.id
    });
  });
};

function sanitizePayload(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((entry) => sanitizePayload(entry));
  }
  if (!input || typeof input !== 'object') {
    if (typeof input === 'string') {
      return input.replace(/\u0000/g, '').trim();
    }
    return input;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    sanitized[key] = sanitizePayload(value);
  }
  return sanitized;
}
