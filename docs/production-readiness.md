# DIRECT Production Readiness

This document tracks the production hardening baseline implemented for DIRECT.

## 1) Project standards

- Monorepo split:
  - `apps/` runnable applications
  - `services/` service-specific Dockerfiles and runtime glue
  - `packages/` shared domain libraries
  - `infra/` provider-specific infrastructure contracts
  - `configs/` environment and deployment configuration
  - `scripts/` operational and validation scripts
- Naming:
  - kebab-case for file names
  - clear module prefixes (`core`, `sales`, `finance`, etc.)
  - event names as `domain.action`
- Logging:
  - structured logging through `@direct/logger`
  - secret redaction by default
  - correlation IDs (`x-request-id`, `x-correlation-id`, `x-trace-id`)
- Error handling:
  - centralized error handler in `securityPlugin`
  - consistent payload with `error`, `message`, `requestId`

## 2) Configuration

- Multi-environment files under `configs/env`:
  - `base.env`
  - `development.env`
  - `staging.env`
  - `production.env`
- Centralized runtime schema in `packages/config/src/index.ts`
- Runtime guards:
  - rejects default JWT secrets in production

## 3) Security baseline

- Access and refresh tokens with rotation:
  - `/v1/auth/login`
  - `/v1/auth/refresh`
  - `/v1/auth/logout`
  - `/v1/auth/me`
- Tenant isolation check:
  - token tenant must match `x-tenant-id` unless role is `admin`
- Brute force control:
  - failed login lock window with configurable thresholds
- Input sanitization:
  - blocks keys with `$` and `.`
- Request body limit enforcement

## 4) Observability baseline

- OpenTelemetry-compatible bridge:
  - metrics and error capture
  - optional OTLP export
- `/metrics` endpoint for snapshot
- request/response/error hooks with correlation context

## 5) Events and resiliency

- Event bus with:
  - retries
  - dead-letter queue
  - idempotency key support
- Utility resilience primitives:
  - timeout
  - retry with backoff
  - circuit breaker
- applied to external calls in embeddings/vector adapters and website fetcher

## 6) Billing and AI hardening

- Billing usage tracker:
  - module usage tracking
  - token and automation charge estimate
  - usage endpoints
- AI usage controls:
  - usage tracking by module/user/tenant
  - response cache
  - model fallback policy
  - short-response decision logic

## 7) Docker and multi-cloud

- Multi-stage Alpine Dockerfiles:
  - root `Dockerfile`
  - `apps/platform-api/Dockerfile`
  - `apps/knowledge-pipeline/Dockerfile`
  - `apps/direct-console/Dockerfile`
  - `services/direct-context.Dockerfile`
- Local compose:
  - MongoDB, Redis, RabbitMQ
  - platform-api, direct-context-api, direct-console
  - healthchecks configured
- Terraform baselines:
  - `infra/aws/terraform`
  - `infra/gcp/terraform`
  - `infra/azure/terraform`
  - `infra/oci/terraform`
  - `infra/railway/terraform`

## 8) CI/CD and testing

- GitHub Actions:
  - `.github/workflows/ci.yml`
  - `.github/workflows/deploy-multicloud.yml`
- Tests:
  - unit (`token-budget`)
  - integration (`knowledge-base`)
  - contract (`api-contract`)
  - load (`scripts/load/basic-load.mjs`)
