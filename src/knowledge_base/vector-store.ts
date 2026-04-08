import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { cosineSimilarity } from '../utils/text';
import { CircuitBreaker, executeWithRetry } from '../utils/resilience';

export interface VectorRecord {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorStoreStats {
  provider: string;
  vectors: number;
  dimensions: number | null;
  details?: Record<string, unknown>;
}

export interface IVectorStoreAdapter {
  readonly provider: string;
  upsertMany(tenantId: string, records: VectorRecord[]): Promise<void>;
  search(tenantId: string, queryVector: number[], topK: number): Promise<VectorSearchResult[]>;
  getStats(tenantId: string): Promise<VectorStoreStats>;
}

type TenantVectorMap = Map<string, VectorRecord>;

export class InMemoryVectorStoreAdapter implements IVectorStoreAdapter {
  readonly provider: string = 'memory';
  protected readonly store = new Map<string, TenantVectorMap>();

  async upsertMany(tenantId: string, records: VectorRecord[]) {
    if (records.length === 0) return;
    const tenantStore = this.getTenantStore(tenantId);
    for (const record of records) {
      tenantStore.set(record.id, record);
    }
  }

  async search(tenantId: string, queryVector: number[], topK: number) {
    const tenantStore = this.getTenantStore(tenantId);
    const scored: VectorSearchResult[] = [];

    for (const item of tenantStore.values()) {
      scored.push({
        id: item.id,
        metadata: item.metadata,
        score: cosineSimilarity(queryVector, item.vector)
      });
    }

    return scored.sort((left, right) => right.score - left.score).slice(0, topK);
  }

  async getStats(tenantId: string): Promise<VectorStoreStats> {
    const tenantStore = this.getTenantStore(tenantId);
    const first = tenantStore.values().next().value as VectorRecord | undefined;
    return {
      provider: this.provider,
      vectors: tenantStore.size,
      dimensions: first?.vector.length ?? null
    };
  }

  protected getTenantStore(tenantId: string) {
    let tenantStore = this.store.get(tenantId);
    if (!tenantStore) {
      tenantStore = new Map<string, VectorRecord>();
      this.store.set(tenantId, tenantStore);
    }
    return tenantStore;
  }
}

export class FileVectorStoreAdapter extends InMemoryVectorStoreAdapter {
  readonly provider: string = 'file';
  private readonly loadedTenants = new Set<string>();
  private readonly rootPath: string;

  constructor(rootPath = resolve('.direct-context-data', 'vectors')) {
    super();
    this.rootPath = rootPath;
  }

  async upsertMany(tenantId: string, records: VectorRecord[]) {
    await this.loadTenant(tenantId);
    await super.upsertMany(tenantId, records);
    await this.persistTenant(tenantId);
  }

  async search(tenantId: string, queryVector: number[], topK: number) {
    await this.loadTenant(tenantId);
    return super.search(tenantId, queryVector, topK);
  }

  async getStats(tenantId: string) {
    await this.loadTenant(tenantId);
    return super.getStats(tenantId);
  }

  private async loadTenant(tenantId: string) {
    if (this.loadedTenants.has(tenantId)) return;
    this.loadedTenants.add(tenantId);

    const file = this.pathFor(tenantId);
    try {
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw) as VectorRecord[];
      const tenantStore = this.getTenantStore(tenantId);
      for (const entry of parsed) {
        tenantStore.set(entry.id, entry);
      }
    } catch {
      // tenant has no stored vectors yet
    }
  }

  private async persistTenant(tenantId: string) {
    const file = this.pathFor(tenantId);
    await mkdir(dirname(file), { recursive: true });
    const tenantStore = this.getTenantStore(tenantId);
    await writeFile(file, JSON.stringify([...tenantStore.values()], null, 2), 'utf8');
  }

  private pathFor(tenantId: string) {
    return resolve(this.rootPath, `${tenantId}.json`);
  }
}

export class HttpVectorDbAdapter implements IVectorStoreAdapter {
  readonly provider = 'http-vector-db';
  private readonly breaker = new CircuitBreaker();

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  async upsertMany(tenantId: string, records: VectorRecord[]) {
    await this.post('/vectors/upsert', {
      tenantId,
      vectors: records
    });
  }

  async search(tenantId: string, queryVector: number[], topK: number) {
    const response = await this.post('/vectors/search', {
      tenantId,
      queryVector,
      topK
    });
    return (response.results ?? []) as VectorSearchResult[];
  }

  async getStats(tenantId: string) {
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/vectors/stats?tenantId=${encodeURIComponent(tenantId)}`;
    const response = await executeWithRetry(
      (signal) =>
        fetch(endpoint, {
          method: 'GET',
          headers: this.headers(),
          signal
        }),
      {
        maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS ?? 3),
        baseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS ?? 200),
        timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10000),
        circuitBreaker: this.breaker
      }
    );
    if (!response.ok) {
      throw new Error(`Vector DB stats failed with status ${response.status}`);
    }
    return (await response.json()) as VectorStoreStats;
  }

  private async post(path: string, payload: Record<string, unknown>) {
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}${path}`;
    const response = await executeWithRetry(
      (signal) =>
        fetch(endpoint, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(payload),
          signal
        }),
      {
        maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS ?? 3),
        baseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS ?? 200),
        timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 10000),
        circuitBreaker: this.breaker
      }
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Vector DB request failed (${response.status}): ${detail}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  private headers() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}

export class FaissVectorStoreAdapter implements IVectorStoreAdapter {
  private readonly fallback: IVectorStoreAdapter;
  private runtime: 'unchecked' | 'available' | 'fallback' = 'unchecked';
  private runtimeError?: string;

  constructor(fallback?: IVectorStoreAdapter) {
    this.fallback = fallback ?? new FileVectorStoreAdapter();
  }

  get provider() {
    return this.runtime === 'available' ? 'faiss-native' : 'faiss-compat';
  }

  async upsertMany(tenantId: string, records: VectorRecord[]) {
    await this.ensureRuntime();
    await this.fallback.upsertMany(tenantId, records);
  }

  async search(tenantId: string, queryVector: number[], topK: number) {
    await this.ensureRuntime();
    return this.fallback.search(tenantId, queryVector, topK);
  }

  async getStats(tenantId: string) {
    await this.ensureRuntime();
    const stats = await this.fallback.getStats(tenantId);
    return {
      ...stats,
      provider: this.provider,
      details: {
        runtime: this.runtime,
        error: this.runtimeError
      }
    };
  }

  private async ensureRuntime() {
    if (this.runtime !== 'unchecked') return;
    const moduleName = 'faiss-node';
    try {
      await import(moduleName);
      this.runtime = 'available';
    } catch (error) {
      this.runtime = 'fallback';
      this.runtimeError = error instanceof Error ? error.message : 'faiss runtime unavailable';
    }
  }
}

export function createVectorStoreAdapter(): IVectorStoreAdapter {
  const provider = (process.env.VECTOR_STORE_PROVIDER ?? 'file').toLowerCase();

  if (provider === 'memory') {
    return new InMemoryVectorStoreAdapter();
  }

  if (provider === 'http') {
    const baseUrl = process.env.VECTOR_DB_URL;
    if (!baseUrl) {
      return new FileVectorStoreAdapter();
    }
    return new HttpVectorDbAdapter(baseUrl, process.env.VECTOR_DB_API_KEY);
  }

  if (provider === 'faiss') {
    return new FaissVectorStoreAdapter(new FileVectorStoreAdapter());
  }

  return new FileVectorStoreAdapter();
}
