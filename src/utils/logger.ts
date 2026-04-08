export interface Logger {
  info(message: string, extra?: Record<string, unknown>): void;
  warn(message: string, extra?: Record<string, unknown>): void;
  error(message: string, extra?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, extra?: Record<string, unknown>) {
    log('INFO', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>) {
    log('WARN', message, extra);
  }

  error(message: string, extra?: Record<string, unknown>) {
    log('ERROR', message, extra);
  }
}

function log(level: string, message: string, extra?: Record<string, unknown>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(extra ?? {})
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}
