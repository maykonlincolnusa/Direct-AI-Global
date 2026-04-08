# DIRECT Platform

DIRECT is a context-first business platform. It ingests sales, financial, operational and digital data, normalizes it into tenant-safe entities, and powers AI over unified context.

## Language versions

- English: [README.en.md](README.en.md)
- Portuguese (Brazil): [README.pt-BR.md](README.pt-BR.md)
- Spanish: [README.es.md](README.es.md)
- French: [README.fr.md](README.fr.md)
- Japanese: [README.ja.md](README.ja.md)
- Mandarin Chinese: [README.zh-CN.md](README.zh-CN.md)

## Production readiness docs

- Architecture: [docs/architecture.md](docs/architecture.md)
- Production hardening: [docs/production-readiness.md](docs/production-readiness.md)
- RAG runtime and vector adapters: [docs/rag-vector-runtime.md](docs/rag-vector-runtime.md)
- Multi-cloud infra: [infra/README.md](infra/README.md)

## Monorepo layout

```txt
apps/
services/
packages/
infra/
configs/
scripts/
src/
tests/
docs/
```

## Quick start (local)

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

## Run with Docker Compose

```bash
docker compose up --build
```

Services:
- Platform API: `http://localhost:3000`
- Context API: `http://localhost:4300`
- Console: `http://localhost:8080`
- RabbitMQ UI: `http://localhost:15672`

## Security and tenancy baseline

- JWT access + refresh token rotation
- Tenant isolation enforcement (`x-tenant-id` vs token)
- Input sanitization and payload size limits
- Rate limiting and brute force login lock
- Structured logs with correlation IDs

## CI/CD

- CI workflow: `.github/workflows/ci.yml`
- Multi-cloud deploy workflow: `.github/workflows/deploy-multicloud.yml`
- Supported deployment targets: AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) and Railway

## Useful scripts

- `npm run readiness:check`
- `npm run db:indexes`
- `npm run db:backup`
- `npm run load:test -- http://localhost:3000/health 200 20`
