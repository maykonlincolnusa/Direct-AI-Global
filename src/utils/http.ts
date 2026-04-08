import { CircuitBreaker, executeWithRetry } from './resilience';

const breaker = new CircuitBreaker();

export async function fetchText(url: string, timeoutMs = 10000) {
  const response = await executeWithRetry(
    (signal) =>
      fetch(url, {
        method: 'GET',
        signal,
        headers: {
          'user-agent': 'DIRECT-WebsiteReader/1.0'
        }
      }),
    {
      maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS ?? 3),
      baseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS ?? 200),
      timeoutMs,
      circuitBreaker: breaker
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}
