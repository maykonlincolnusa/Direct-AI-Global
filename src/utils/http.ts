import { CircuitBreaker, executeWithRetry } from './resilience';

const breaker = new CircuitBreaker();

export async function fetchText(url: string, timeoutMs = 10000) {
  const response = await request(url, {
    method: 'GET',
    timeoutMs,
    headers: {
      'user-agent': 'DIRECT-WebsiteReader/1.0'
    }
  });
  return response.text();
}

export async function fetchJson<T>(
  url: string,
  options: {
    method?: 'GET' | 'POST';
    timeoutMs?: number;
    headers?: Record<string, string>;
    body?: string;
  } = {}
) {
  const response = await request(url, options);
  return (await response.json()) as T;
}

export async function postForm<T>(
  url: string,
  form: Record<string, string | number | boolean | undefined>,
  options: {
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (typeof value === 'undefined') continue;
    body.set(key, String(value));
  }

  return fetchJson<T>(url, {
    method: 'POST',
    timeoutMs: options.timeoutMs,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers
    },
    body: body.toString()
  });
}

export function withQuery(url: string, query: Record<string, string | number | boolean | undefined>) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined' || value === '') continue;
    target.searchParams.set(key, String(value));
  }
  return target.toString();
}

async function request(
  url: string,
  options: {
    method?: 'GET' | 'POST';
    timeoutMs?: number;
    headers?: Record<string, string>;
    body?: string;
  }
) {
  const response = await executeWithRetry(
    (signal) =>
      fetch(url, {
        method: options.method ?? 'GET',
        signal,
        headers: options.headers,
        body: options.body
      }),
    {
      maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS ?? 3),
      baseDelayMs: Number(process.env.RETRY_BASE_DELAY_MS ?? 200),
      timeoutMs: options.timeoutMs ?? 10000,
      circuitBreaker: breaker
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response;
}
