type CounterEntry = {
  value: number;
  expiresAt?: number;
};

type StringEntry = {
  value: string;
  expiresAt?: number;
};

type ListEntry = {
  values: string[];
  expiresAt?: number;
};

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttlSeconds?: number): Promise<unknown>;
  del(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
};

export class RuntimeStateStore {
  private readonly counters = new Map<string, CounterEntry>();
  private readonly strings = new Map<string, StringEntry>();
  private readonly lists = new Map<string, ListEntry>();
  private redisPromise?: Promise<RedisClient | null>;

  constructor(private readonly namespace = 'direct-ai') {}

  async increment(key: string, amount: number, ttlSeconds?: number) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      const next = await redis.incrby(namespacedKey, amount);
      if (ttlSeconds && next === amount) {
        await redis.expire(namespacedKey, ttlSeconds);
      }
      return next;
    }

    const current = this.readCounter(namespacedKey);
    const next = current + amount;
    this.counters.set(namespacedKey, {
      value: next,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
    return next;
  }

  async getCounter(key: string) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      return Number(await redis.get(namespacedKey) ?? 0);
    }
    return this.readCounter(namespacedKey);
  }

  async setString(key: string, value: string, ttlSeconds?: number) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      if (ttlSeconds) {
        await redis.set(namespacedKey, value, 'EX', ttlSeconds);
      } else {
        await redis.set(namespacedKey, value);
      }
      return;
    }

    this.strings.set(namespacedKey, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
  }

  async getString(key: string) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      return redis.get(namespacedKey);
    }

    const entry = this.strings.get(namespacedKey);
    if (!entry) return null;
    if (this.isExpired(entry.expiresAt)) {
      this.strings.delete(namespacedKey);
      return null;
    }
    return entry.value;
  }

  async appendList(key: string, value: string, ttlSeconds?: number) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      await redis.rpush(namespacedKey, value);
      if (ttlSeconds) {
        await redis.expire(namespacedKey, ttlSeconds);
      }
      return;
    }

    const current = this.lists.get(namespacedKey);
    const nextValues = [...(current?.values ?? []), value];
    this.lists.set(namespacedKey, {
      values: nextValues,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : current?.expiresAt
    });
  }

  async getList(key: string, start = 0, stop = -1) {
    const namespacedKey = this.key(key);
    const redis = await this.redis();
    if (redis) {
      return redis.lrange(namespacedKey, start, stop);
    }

    const entry = this.lists.get(namespacedKey);
    if (!entry) return [];
    if (this.isExpired(entry.expiresAt)) {
      this.lists.delete(namespacedKey);
      return [];
    }

    const end = stop === -1 ? entry.values.length : stop + 1;
    return entry.values.slice(start, end);
  }

  private key(input: string) {
    return `${this.namespace}:${input}`;
  }

  private readCounter(key: string) {
    const entry = this.counters.get(key);
    if (!entry) return 0;
    if (this.isExpired(entry.expiresAt)) {
      this.counters.delete(key);
      return 0;
    }
    return entry.value;
  }

  private isExpired(expiresAt?: number) {
    return typeof expiresAt === 'number' && expiresAt <= Date.now();
  }

  private async redis() {
    if (!this.redisPromise) {
      this.redisPromise = this.connectRedis();
    }
    return this.redisPromise;
  }

  private async connectRedis(): Promise<RedisClient | null> {
    if (!process.env.REDIS_URL) {
      return null;
    }

    try {
      const module = await import('ioredis');
      const Redis = (module as { default: new (url: string, options?: Record<string, unknown>) => RedisClient }).default;
      return new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true
      });
    } catch {
      return null;
    }
  }
}
