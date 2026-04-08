import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { randomUUID, createHash } from 'node:crypto';
import { z } from 'zod';
import { authPayloadSchema, AuthPolicy, TokenBudgetManager } from '@direct/shared-auth';
import { config } from '@direct/config';
import { logger } from '@direct/logger';

const loginSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  roles: z.array(z.string()).default(['user']),
  password: z.string().min(1).optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

type RefreshSession = {
  id: string;
  tenantId: string;
  userId: string;
  roles: string[];
  tokenHash: string;
  issuedAt: number;
  expiresAt: number;
  revokedAt?: number;
  ip?: string;
};

type FailedLoginState = {
  attempts: number;
  lockedUntil?: number;
};

const failedLogins = new Map<string, FailedLoginState>();
const refreshSessions = new Map<string, RefreshSession>();

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  const budgetManager = new TokenBudgetManager({
    perRequest: config.TOKEN_BUDGET_PER_REQUEST,
    perUser: config.TOKEN_BUDGET_PER_USER,
    perTenant: config.TOKEN_BUDGET_PER_TENANT,
    perModule: config.TOKEN_BUDGET_PER_MODULE
  });

  const policy = new AuthPolicy();
  fastify.decorate('tokenBudget', budgetManager);
  fastify.decorateRequest('authContext', authPayloadSchema.parse({}));

  fastify.decorate('authenticate', async (request) => {
    const token = extractBearerToken(request);
    if (!token) {
      throw fastify.httpErrors.unauthorized('missing bearer token');
    }

    const decoded = await fastify.jwt.verify<{
      tenantId: string;
      userId: string;
      roles: string[];
      attributes?: Record<string, unknown>;
    }>(token, {
      allowedIss: config.JWT_ISSUER,
      allowedAud: config.JWT_AUDIENCE
    } as any);

    const context = authPayloadSchema.parse({
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      roles: decoded.roles,
      attributes: decoded.attributes ?? {}
    });
    request.authContext = context;

    const headerTenant = request.headers['x-tenant-id'] as string | undefined;
    if (headerTenant && !policy.allowsTenant(context, headerTenant)) {
      throw fastify.httpErrors.forbidden('tenant isolation check failed');
    }

    return context;
  });

  fastify.addHook('onRequest', async (request) => {
    if (request.method === 'OPTIONS' || isPublicPath(request.url)) return;
    await fastify.authenticate(request);
  });

  fastify.post('/v1/auth/login', async (request, reply) => {
    const sourceIp = getSourceIp(request);
    const lock = failedLogins.get(sourceIp);
    if (lock?.lockedUntil && lock.lockedUntil > Date.now()) {
      reply.status(429).send({ message: 'too many failed login attempts' });
      return;
    }

    const payload = loginSchema.parse(request.body ?? {});
    const expectedPassword = process.env.AUTH_DEMO_PASSWORD;
    if (expectedPassword && payload.password !== expectedPassword) {
      registerFailedLogin(sourceIp);
      reply.status(401).send({ message: 'invalid credentials' });
      return;
    }

    clearFailedLogin(sourceIp);
    const tokenPayload = {
      tenantId: payload.tenantId,
      userId: payload.userId,
      roles: payload.roles
    };
    const accessToken = fastify.jwt.sign(tokenPayload, {
      expiresIn: config.JWT_ACCESS_TTL,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    } as any);

    const refreshId = randomUUID();
    const refreshToken = fastify.jwt.sign(
      {
        sid: refreshId,
        tenantId: payload.tenantId,
        userId: payload.userId,
        roles: payload.roles,
        type: 'refresh'
      },
      {
        secret: config.JWT_REFRESH_SECRET,
        expiresIn: `${config.JWT_REFRESH_TTL_SECONDS}s`,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE
      } as any
    );
    refreshSessions.set(refreshId, {
      id: refreshId,
      tenantId: payload.tenantId,
      userId: payload.userId,
      roles: payload.roles,
      tokenHash: hashToken(refreshToken),
      issuedAt: Date.now(),
      expiresAt: Date.now() + config.JWT_REFRESH_TTL_SECONDS * 1000,
      ip: sourceIp
    });

    reply.status(200).send({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT_ACCESS_TTL
    });
  });

  fastify.post('/v1/auth/refresh', async (request, reply) => {
    const payload = refreshSchema.parse(request.body ?? {});
    const decoded = await fastify.jwt.verify<{
      sid: string;
      tenantId: string;
      userId: string;
      roles: string[];
      type: string;
    }>(payload.refreshToken, {
      secret: config.JWT_REFRESH_SECRET,
      allowedIss: config.JWT_ISSUER,
      allowedAud: config.JWT_AUDIENCE
    } as any);

    if (decoded.type !== 'refresh') {
      reply.status(401).send({ message: 'invalid refresh token type' });
      return;
    }

    const session = refreshSessions.get(decoded.sid);
    if (!session) {
      reply.status(401).send({ message: 'refresh session not found' });
      return;
    }
    if (session.revokedAt) {
      reply.status(401).send({ message: 'refresh token revoked' });
      return;
    }
    if (session.expiresAt < Date.now()) {
      refreshSessions.delete(decoded.sid);
      reply.status(401).send({ message: 'refresh token expired' });
      return;
    }
    if (session.tokenHash !== hashToken(payload.refreshToken)) {
      reply.status(401).send({ message: 'refresh token mismatch' });
      return;
    }

    session.revokedAt = Date.now();
    refreshSessions.set(decoded.sid, session);
    const newSessionId = randomUUID();

    const accessToken = fastify.jwt.sign(
      {
        tenantId: session.tenantId,
        userId: session.userId,
        roles: session.roles
      },
      {
        expiresIn: config.JWT_ACCESS_TTL,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE
      } as any
    );

    const refreshToken = fastify.jwt.sign(
      {
        sid: newSessionId,
        tenantId: session.tenantId,
        userId: session.userId,
        roles: session.roles,
        type: 'refresh'
      },
      {
        secret: config.JWT_REFRESH_SECRET,
        expiresIn: `${config.JWT_REFRESH_TTL_SECONDS}s`,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE
      } as any
    );

    refreshSessions.set(newSessionId, {
      id: newSessionId,
      tenantId: session.tenantId,
      userId: session.userId,
      roles: session.roles,
      tokenHash: hashToken(refreshToken),
      issuedAt: Date.now(),
      expiresAt: Date.now() + config.JWT_REFRESH_TTL_SECONDS * 1000,
      ip: getSourceIp(request)
    });

    reply.status(200).send({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: config.JWT_ACCESS_TTL
    });
  });

  fastify.post('/v1/auth/logout', async (request, reply) => {
    const payload = refreshSchema.parse(request.body ?? {});
    try {
      const decoded = await fastify.jwt.verify<{ sid: string }>(payload.refreshToken, {
        secret: config.JWT_REFRESH_SECRET
      } as any);
      const current = refreshSessions.get(decoded.sid);
      if (current) {
        current.revokedAt = Date.now();
        refreshSessions.set(decoded.sid, current);
      }
    } catch (error) {
      logger.warn({ err: error }, 'invalid refresh token on logout');
    }

    reply.status(204).send();
  });

  fastify.get('/v1/auth/me', async (request, reply) => {
    const context = await fastify.authenticate(request);
    reply.send({
      tenantId: context.tenantId,
      userId: context.userId,
      roles: context.roles,
      attributes: context.attributes
    });
  });
};

function extractBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function isPublicPath(url: string) {
  return (
    url === '/' ||
    url === '/health' ||
    url === '/metrics' ||
    url.startsWith('/v1/auth/login') ||
    url.startsWith('/v1/auth/refresh') ||
    url.startsWith('/v1/auth/logout')
  );
}

function getSourceIp(request: FastifyRequest) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function registerFailedLogin(ip: string) {
  const current = failedLogins.get(ip) ?? { attempts: 0 };
  current.attempts += 1;
  if (current.attempts >= config.AUTH_RATE_LIMIT_POINTS) {
    current.lockedUntil = Date.now() + config.AUTH_RATE_LIMIT_WINDOW_MS;
  }
  failedLogins.set(ip, current);
}

function clearFailedLogin(ip: string) {
  failedLogins.delete(ip);
}
