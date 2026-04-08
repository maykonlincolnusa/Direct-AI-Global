export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  timeoutMs: number;
  circuitBreaker?: CircuitBreaker;
};

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = 'closed';
  private openedAt = 0;

  constructor(
    private readonly failureThreshold = Number(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD ?? 5),
    private readonly resetMs = Number(process.env.CIRCUIT_BREAKER_RESET_MS ?? 15000)
  ) {}

  canExecute() {
    if (this.state === 'closed') return true;
    if (this.state === 'open' && Date.now() - this.openedAt > this.resetMs) {
      this.state = 'half-open';
      return true;
    }
    return this.state === 'half-open';
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}

export async function executeWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  if (options.circuitBreaker && !options.circuitBreaker.canExecute()) {
    throw new Error('circuit breaker open');
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt < options.maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const result = await operation(controller.signal);
      if (options.circuitBreaker) options.circuitBreaker.onSuccess();
      return result;
    } catch (error) {
      lastError = error;
      if (options.circuitBreaker) options.circuitBreaker.onFailure();
      if (attempt >= options.maxAttempts) break;
      await sleep(options.baseDelayMs * attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('operation failed after retries');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
