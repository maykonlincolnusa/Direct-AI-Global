import { createHash } from 'node:crypto';
import { CircuitBreaker, executeWithRetry } from '../utils/resilience';

type EmbeddingProvider = 'deterministic' | 'openrouter';

interface OpenRouterEmbeddingResponse {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
}

interface EmbeddingProviderClient {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

class DeterministicEmbeddingProvider implements EmbeddingProviderClient {
  readonly name = 'deterministic';

  constructor(readonly dimensions: number) {}

  async embed(text: string) {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/g)
      .filter((token) => token.length > 2);

    for (const token of tokens) {
      const digest = createHash('sha1').update(token).digest();
      const slot = digest[0] % this.dimensions;
      const signal = digest[1] % 2 === 0 ? 1 : -1;
      vector[slot] += signal;
    }

    return normalize(vector);
  }

  async embedBatch(texts: string[]) {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
}

class OpenRouterEmbeddingProvider implements EmbeddingProviderClient {
  readonly name = 'openrouter';
  readonly dimensions: number;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly appName: string;
  private readonly referer?: string;
  private readonly breaker: CircuitBreaker;

  constructor(private readonly fallbackDimensions = 1536) {
    this.endpoint = process.env.OPENROUTER_EMBEDDINGS_URL ?? 'https://openrouter.ai/api/v1/embeddings';
    this.model = process.env.OPENROUTER_EMBEDDING_MODEL ?? 'openai/text-embedding-3-small';
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    this.appName = process.env.OPENROUTER_APP_NAME ?? 'DIRECT';
    this.referer = process.env.OPENROUTER_REFERER;
    this.breaker = new CircuitBreaker();
    this.dimensions = fallbackDimensions;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required when EMBEDDING_PROVIDER=openrouter');
    }
  }

  async embed(text: string) {
    const vectors = await this.embedBatch([text]);
    if (!vectors[0]) {
      throw new Error('OpenRouter embedding response did not include vectors');
    }
    return vectors[0];
  }

  async embedBatch(texts: string[]) {
    if (texts.length === 0) return [];

    const payload = {
      model: this.model,
      input: texts
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-OpenRouter-Title': this.appName
    };

    if (this.referer) {
      headers['HTTP-Referer'] = this.referer;
    }

    const response = await executeWithRetry(
      (signal) =>
        fetch(this.endpoint, {
          method: 'POST',
          headers,
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
      throw new Error(`OpenRouter embeddings failed with status ${response.status}: ${detail}`);
    }

    const parsed = (await response.json()) as OpenRouterEmbeddingResponse;
    const rows = parsed.data ?? [];
    if (rows.length === 0) {
      throw new Error('OpenRouter embeddings returned no vectors');
    }

    return rows
      .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((entry) => normalize(entry.embedding ?? []));
  }
}

export class EmbeddingService {
  private readonly providerClient: EmbeddingProviderClient;
  private readonly fallbackReason?: string;

  constructor(options: { dimensions?: number; provider?: EmbeddingProvider; strict?: boolean } = {}) {
    const dimensions = options.dimensions ?? Number(process.env.EMBEDDING_DIMENSIONS ?? 128);
    const requestedProvider =
      options.provider ?? ((process.env.EMBEDDING_PROVIDER as EmbeddingProvider | undefined) ?? 'deterministic');
    const strictMode = options.strict ?? (process.env.EMBEDDING_STRICT === 'true');

    if (requestedProvider === 'openrouter') {
      try {
        this.providerClient = new OpenRouterEmbeddingProvider();
        return;
      } catch (error) {
        if (strictMode) {
          throw error;
        }
        this.providerClient = new DeterministicEmbeddingProvider(dimensions);
        this.fallbackReason = error instanceof Error ? error.message : 'unknown embedding provider error';
        return;
      }
    }

    this.providerClient = new DeterministicEmbeddingProvider(dimensions);
  }

  get provider() {
    return this.providerClient.name;
  }

  get dimensions() {
    return this.providerClient.dimensions;
  }

  get fallback() {
    return this.fallbackReason;
  }

  async embed(text: string) {
    return this.providerClient.embed(text);
  }

  async embedBatch(texts: string[]) {
    return this.providerClient.embedBatch(texts);
  }
}

function normalize(vector: number[]) {
  let norm = 0;
  for (const value of vector) {
    norm += value * value;
  }
  if (norm === 0) return vector;
  const divisor = Math.sqrt(norm);
  return vector.map((value) => value / divisor);
}
