import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: process.env.OTEL_SERVICE_NAME ?? process.env.APP_NAME ?? 'direct-platform',
    environment: process.env.NODE_ENV ?? 'development'
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'authorization',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      '*.refreshToken'
    ],
    remove: true
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined
});
