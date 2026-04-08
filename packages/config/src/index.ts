import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnvFiles();

const configSchema = z.object({
  APP_NAME: z.string().default('direct-platform'),
  APP_VERSION: z.string().default('1.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLOUD_PROVIDER: z.enum(['local', 'aws', 'azure', 'gcp', 'oci', 'railway']).default('local'),
  API_HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3000),
  REQUEST_BODY_LIMIT: z.coerce.number().default(1_048_576),
  TRUST_PROXY: z.coerce.number().default(0),
  CORS_ORIGINS: z.string().default('*'),
  MONGO_URI: z.string().url().default('mongodb://localhost:27017/direct-core'),
  MONGO_DB_PREFIX: z.string().default('direct'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  RABBITMQ_URL: z.string().url().default('amqp://localhost:5672'),
  JWT_SECRET: z.string().default('super-secret-key'),
  JWT_REFRESH_SECRET: z.string().default('super-refresh-secret-key'),
  JWT_ISSUER: z.string().default('direct-platform'),
  JWT_AUDIENCE: z.string().default('direct-clients'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 30),
  LOG_LEVEL: z.string().default('info'),
  DEFAULT_LOCALE: z.string().default('en-US'),
  DEFAULT_CURRENCY: z.string().default('USD'),
  APP_REGION: z.enum(['BR', 'LATAM', 'US', 'EU', 'APAC']).default('US'),
  RATE_LIMIT_POINTS: z.coerce.number().default(1500),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  AUTH_RATE_LIMIT_POINTS: z.coerce.number().default(20),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  TOKEN_BUDGET_BASE: z.coerce.number().default(1200),
  TOKEN_BUDGET_PER_REQUEST: z.coerce.number().default(900),
  TOKEN_BUDGET_PER_USER: z.coerce.number().default(3000),
  TOKEN_BUDGET_PER_TENANT: z.coerce.number().default(25000),
  TOKEN_BUDGET_PER_MODULE: z.coerce.number().default(5000),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(10000),
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3),
  RETRY_BASE_DELAY_MS: z.coerce.number().default(200),
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_RESET_MS: z.coerce.number().default(15000),
  OTEL_ENABLED: z.preprocess(
    (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    },
    z.boolean().default(false)
  ),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('direct-platform-api'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs', 'azure', 'oci']).default('local'),
  STORAGE_BUCKET: z.string().default('direct-assets'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BASE_PATH: z.string().default('.direct-context-data/storage'),
  FEATURE_FLAGS_JSON: z.string().default('{}')
}).superRefine((config, ctx) => {
  if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'super-secret-key') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be overridden in production'
      });
    }
    if (config.JWT_REFRESH_SECRET === 'super-refresh-secret-key') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be overridden in production'
      });
    }
  }
});

export const config = configSchema.parse(process.env);
export type Config = z.infer<typeof configSchema>;

function loadEnvFiles() {
  const envName = process.env.NODE_ENV ?? 'development';
  const requestedFile = process.env.CONFIG_ENV_FILE;
  const candidates = [
    resolve(process.cwd(), 'configs', 'env', 'base.env'),
    resolve(process.cwd(), 'configs', 'env', `${envName}.env`),
    requestedFile ? resolve(process.cwd(), requestedFile) : undefined,
    resolve(process.cwd(), '.env')
  ].filter((entry): entry is string => Boolean(entry));

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    dotenv.config({ path: file, override: false });
  }
}
