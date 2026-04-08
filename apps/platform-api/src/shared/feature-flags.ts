import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '@direct/config';

const flagUpdateSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  tenantId: z.string().optional()
});

type FlagStore = Record<string, boolean>;

export class FeatureFlagRegistry {
  private readonly globalFlags: FlagStore = {};
  private readonly tenantFlags = new Map<string, FlagStore>();

  constructor(seed: string) {
    try {
      const parsed = JSON.parse(seed) as Record<string, boolean>;
      for (const [key, value] of Object.entries(parsed)) {
        this.globalFlags[key] = Boolean(value);
      }
    } catch {
      // ignore invalid seed and keep empty defaults
    }
  }

  isEnabled(key: string, tenantId?: string) {
    if (tenantId) {
      const tenantConfig = this.tenantFlags.get(tenantId);
      if (tenantConfig && key in tenantConfig) {
        return tenantConfig[key];
      }
    }
    return Boolean(this.globalFlags[key]);
  }

  setFlag(key: string, enabled: boolean, tenantId?: string) {
    if (!tenantId) {
      this.globalFlags[key] = enabled;
      return;
    }
    const current = this.tenantFlags.get(tenantId) ?? {};
    current[key] = enabled;
    this.tenantFlags.set(tenantId, current);
  }

  list(tenantId?: string) {
    if (!tenantId) return { ...this.globalFlags };
    return {
      ...this.globalFlags,
      ...(this.tenantFlags.get(tenantId) ?? {})
    };
  }
}

export const featureFlagsPlugin: FastifyPluginAsync = async (fastify) => {
  const registry = new FeatureFlagRegistry(config.FEATURE_FLAGS_JSON);
  fastify.decorate('featureFlags', registry);

  fastify.get('/v1/core/feature-flags', async (request) => {
    const tenantId = (request.query as { tenantId?: string } | undefined)?.tenantId;
    return {
      tenantId: tenantId ?? null,
      flags: registry.list(tenantId)
    };
  });

  fastify.post('/v1/core/feature-flags', async (request, reply) => {
    const payload = flagUpdateSchema.parse(request.body ?? {});
    registry.setFlag(payload.key, payload.enabled, payload.tenantId);
    reply.status(200).send({
      message: 'flag updated',
      key: payload.key,
      enabled: payload.enabled,
      tenantId: payload.tenantId ?? null
    });
  });
};
