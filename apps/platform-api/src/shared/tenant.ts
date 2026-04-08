import type { FastifyPluginAsync } from 'fastify';
import { config } from '@direct/config';
import { resolveTenant } from '@direct/shared-tenant';
import { logger } from '@direct/logger';

export const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('tenantResolver', resolveTenant);

  fastify.addHook('preHandler', async (request) => {
    const headerTenant = request.headers['x-tenant-id'] as string | undefined;
    const regionHint = (request.headers['x-region'] as string | undefined) ?? config.APP_REGION;
    const profile = resolveTenant({
      id: headerTenant,
      region: regionHint as any
    });
    request.tenantProfile = profile;
    logger.debug(
      {
        tenant: profile.id,
        region: profile.region,
        requestId: request.observabilityContext?.requestId
      },
      'tenant profile attached'
    );
  });
};
