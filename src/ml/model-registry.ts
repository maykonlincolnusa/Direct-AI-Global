import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface RegisteredModel {
  id: string;
  type: 'embedding' | 'routing' | 'retrieval' | 'critic';
  version: string;
  status: 'active' | 'candidate';
  notes: string;
  updatedAt: string;
}

const REGISTRY_FILE = resolve('.direct-context-data', 'ml', 'registry', 'models.json');

const DEFAULT_MODELS: RegisteredModel[] = [
  {
    id: 'hash-embedding-v1',
    type: 'embedding',
    version: 'v1',
    status: 'active',
    notes: 'Embedding hash deterministico local, pronto para troca por provider real.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'heuristic-router-v1',
    type: 'routing',
    version: 'v1',
    status: 'active',
    notes: 'Router heuristico para sales, finance, operations e strategy.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hybrid-retrieval-v1',
    type: 'retrieval',
    version: 'v1',
    status: 'active',
    notes: 'Busca vetorial com boost lexical e citacoes.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'grounding-critic-v1',
    type: 'critic',
    version: 'v1',
    status: 'active',
    notes: 'Critic simples para degradacao e confianca.',
    updatedAt: new Date().toISOString()
  }
];

export class ModelRegistry {
  async list() {
    try {
      return JSON.parse(await readFile(REGISTRY_FILE, 'utf8')) as RegisteredModel[];
    } catch {
      await this.persist(DEFAULT_MODELS);
      return DEFAULT_MODELS;
    }
  }

  async register(model: RegisteredModel) {
    const current = await this.list();
    const next = current.filter((entry) => entry.id !== model.id);
    next.push(model);
    await this.persist(next);
    return model;
  }

  private async persist(models: RegisteredModel[]) {
    await mkdir(dirname(REGISTRY_FILE), { recursive: true });
    await writeFile(REGISTRY_FILE, JSON.stringify(models, null, 2), 'utf8');
  }
}
