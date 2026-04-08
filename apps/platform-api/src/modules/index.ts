import { FastifyPluginAsync } from 'fastify';
import { createModulePlugin } from './module-factory.js';
import { moduleDefinitions } from './definitions.js';

const modules: FastifyPluginAsync = async (fastify) => {
  for (const definition of moduleDefinitions) {
    fastify.register(createModulePlugin(definition), {
      prefix: definition.prefix
    });
  }
};

export default modules;
export { moduleDefinitions };
