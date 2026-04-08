export type ObservabilityContext = {
  requestId: string;
  tenantId?: string;
  module?: string;
  traceId?: string;
  spanId?: string;
  method?: string;
  path?: string;
  timestamp: string;
};

export type CapturedMetric = {
  name: string;
  value: number;
  context: ObservabilityContext;
};

export type CapturedError = {
  message: string;
  code?: string;
  context: ObservabilityContext;
};

export function createObservabilityContext(
  partial: Partial<Omit<ObservabilityContext, 'timestamp'>> = {}
): ObservabilityContext {
  return {
    requestId: partial.requestId ?? cryptoRandomId(24),
    timestamp: new Date().toISOString(),
    tenantId: partial.tenantId,
    module: partial.module,
    traceId: partial.traceId ?? cryptoRandomId(32),
    spanId: partial.spanId ?? cryptoRandomId(16),
    method: partial.method,
    path: partial.path
  };
}

export function recordMetric(name: string, value: number, context: ObservabilityContext) {
  return {
    metric: name,
    value,
    context,
    recordedAt: new Date().toISOString()
  };
}

export class ObservabilityBridge {
  private metrics: CapturedMetric[] = [];
  private errors: CapturedError[] = [];
  private readonly otelEnabled: boolean;
  private readonly otelEndpoint?: string;
  private readonly serviceName: string;

  constructor(options: { otelEnabled?: boolean; otelEndpoint?: string; serviceName?: string } = {}) {
    this.otelEnabled = options.otelEnabled ?? false;
    this.otelEndpoint = options.otelEndpoint;
    this.serviceName = options.serviceName ?? 'direct-platform-api';
  }

  capture(name: string, value: number, context: ObservabilityContext) {
    const payload = { name, value, context };
    this.metrics.push(payload);
    void this.exportMetric(payload);
  }

  captureError(error: unknown, context: ObservabilityContext) {
    const normalized = normalizeError(error);
    const payload = {
      ...normalized,
      context
    };
    this.errors.push(payload);
    void this.exportError(payload);
  }

  snapshot() {
    return {
      metrics: [...this.metrics],
      errors: [...this.errors]
    };
  }

  reset() {
    this.metrics.length = 0;
    this.errors.length = 0;
  }

  private async exportMetric(metric: CapturedMetric) {
    if (!this.otelEnabled || !this.otelEndpoint) return;
    await postJson(this.otelEndpoint, {
      type: 'metric',
      service: this.serviceName,
      metric
    });
  }

  private async exportError(error: CapturedError) {
    if (!this.otelEnabled || !this.otelEndpoint) return;
    await postJson(this.otelEndpoint, {
      type: 'error',
      service: this.serviceName,
      error
    });
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name
    };
  }
  return {
    message: typeof error === 'string' ? error : 'unknown_error'
  };
}

async function postJson(url: string, body: unknown) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    // no-op: observability export must not crash runtime
  }
}

function cryptoRandomId(size: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(size)]
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join('');
}
