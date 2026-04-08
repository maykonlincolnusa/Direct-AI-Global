import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = detectRootDirectory(process.cwd());

export const PIPELINE_PATHS = {
  root,
  knowledgeBase: resolve(root, 'knowledge-base'),
  raw: resolve(root, 'knowledge-base', 'raw'),
  processed: resolve(root, 'knowledge-base', 'processed'),
  chunks: resolve(root, 'knowledge-base', 'chunks'),
  metadata: resolve(root, 'knowledge-base', 'metadata'),
  embeddings: resolve(root, 'knowledge-base', 'embeddings'),
  taxonomy: resolve(root, 'knowledge-base', 'taxonomy'),
  kbLogs: resolve(root, 'knowledge-base', 'logs'),
  logs: resolve(root, 'logs'),
  stateFile: resolve(root, 'knowledge-base', 'metadata', '_state.json'),
  reportFile: resolve(root, 'knowledge-base', 'logs', 'final-report.json'),
  taxonomyFile: resolve(root, 'knowledge-base', 'taxonomy', 'taxonomy.json')
} as const;

export const PIPELINE_CONFIG = {
  batchSize: Number(process.env.KB_BATCH_SIZE ?? 25),
  dedupeSimilarityThreshold: Number(process.env.KB_DEDUPE_THRESHOLD ?? 0.9),
  minChunkTokens: Number(process.env.KB_MIN_CHUNK_TOKENS ?? 300),
  maxChunkTokens: Number(process.env.KB_MAX_CHUNK_TOKENS ?? 800)
} as const;

function detectRootDirectory(startAt: string) {
  let current = startAt;

  while (true) {
    if (isWorkspaceRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return startAt;
    }
    current = parent;
  }
}

function isWorkspaceRoot(candidate: string) {
  const packagePath = resolve(candidate, 'package.json');
  const knowledgePath = resolve(candidate, 'knowledge-base');
  if (!existsSync(packagePath) || !existsSync(knowledgePath)) return false;

  try {
    const parsed = JSON.parse(readFileSync(packagePath, 'utf8')) as {
      workspaces?: unknown;
    };
    return Array.isArray(parsed.workspaces);
  } catch {
    return false;
  }
}
