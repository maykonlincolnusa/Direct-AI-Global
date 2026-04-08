import { FastifyPluginAsync } from 'fastify';

export type FrontendSurface = {
  home: string;
  dashboards: string[];
  menus: string[];
  filters: string[];
  states: {
    empty: string;
    loading: string;
  };
};

export type BackendSurface = {
  services: string[];
  collections: string[];
  commands: string[];
  events: string[];
  integrations: string[];
};

export type ModuleDefinition = {
  key: string;
  name: string;
  description: string;
  prefix: string;
  frontEnd: FrontendSurface;
  backEnd: BackendSurface;
  billing: {
    plan: string;
    includeIA: boolean;
    addon?: string;
  };
  iaHooks: string[];
  tokenBudget: number;
};

export const createModulePlugin = (definition: ModuleDefinition): FastifyPluginAsync => {
  const plugin: FastifyPluginAsync = async (fastify) => {
    fastify.get('/status', async () => ({
      module: definition.name,
      description: definition.description,
      tokenBudget: definition.tokenBudget,
      events: definition.backEnd.events
    }));

    fastify.get('/ui', async () => ({
      home: definition.frontEnd.home,
      dashboards: definition.frontEnd.dashboards,
      filters: definition.frontEnd.filters,
      states: definition.frontEnd.states
    }));

    fastify.get('/events', async () => ({
      available: definition.backEnd.events,
      integrations: definition.backEnd.integrations
    }));

    fastify.post<{ Params: { command: string } }>('/commands/:command', async (request, reply) => {
      const { command } = request.params;
      if (!definition.backEnd.commands.includes(command)) {
        reply.status(404).send({ message: 'command not found' });
        return;
      }

      const authContext = request.authContext;
      const tokens = definition.tokenBudget;
      try {
        fastify.tokenBudget.ensureBudget(authContext.tenantId ?? 'public', definition.key, tokens);
      } catch (err) {
        reply.status(429).send({
          message: 'token budget exceeded',
          detail: (err as Error).message
        });
        return;
      }

      fastify.log.info({ module: definition.key, command, tokens }, 'command executed');

      return {
        executed: command,
        tokensConsumed: tokens,
        payload: request.body,
        events: definition.backEnd.events
      };
    });
  };

  return plugin;
};
