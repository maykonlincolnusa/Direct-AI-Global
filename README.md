# DIRECT Platform

DIRECT is a context-first business platform. It does not build websites for clients. It ingests, normalizes and unifies business context from multiple sources so AI can reason over sales, finance, operations, digital presence and knowledge assets in one place.

## Language versions

- English: [README.en.md](README.en.md)
- Portuguese (Brazil): [README.pt-BR.md](README.pt-BR.md)
- Spanish: [README.es.md](README.es.md)
- French: [README.fr.md](README.fr.md)
- Japanese: [README.ja.md](README.ja.md)
- Mandarin Chinese: [README.zh-CN.md](README.zh-CN.md)

## Current platform baseline

- Unified context ingestion with raw persistence, canonical normalization, idempotent fingerprinting and versioned context snapshots
- Canonical business model for `Customer`, `Lead`, `Company`, `Product`, `Order`, `Payment`, `FinancialRecord`, `OperationalEvent`, `Message`, `WebsitePage`, `SocialPost`, `BusinessProfile`, `Document`, `FileAsset`, `Review` and `Campaign`
- Tenant-scoped knowledge base with chunking, embeddings, semantic retrieval and reranking
- AI layer with model routing, confidence scoring, token usage tracking and usage-based billing estimates
- React console with dashboards for `industry profile`, `readiness`, `execution plan`, connector health and AI usage
- Production-ready connectors for Website Reader, Google Business Profile, HubSpot CRM, Stripe Finance, ERP REST, Social RSS/Atom and Manual Upload
- Multi-cloud deployment baseline for AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) and Railway

## Industries served

DIRECT is designed to support:

1. B2B services and consulting firms
2. SaaS and technology companies
3. Retail and e-commerce operations
4. Healthcare clinics and private practices
5. Education and training businesses
6. Real estate agencies and brokerages
7. Hospitality, restaurants and local service chains
8. Beauty, wellness and personal care brands
9. Automotive sales and service operations
10. Manufacturing and distribution teams

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

## Run locally

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
- React Console: `http://localhost:8080`
- RabbitMQ UI: `http://localhost:15672`

## Key API routes

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/connectors/recommendations`
6. `GET /api/tenants/:tenantId/context/summary`
7. `GET /api/tenants/:tenantId/context/industry`
8. `GET /api/tenants/:tenantId/context/readiness`
9. `GET /api/tenants/:tenantId/context/execution-plan`
10. `GET /api/tenants/:tenantId/context/usage`
11. `POST /api/tenants/:tenantId/context/ask`

## Security and tenancy baseline

- JWT access and refresh token rotation
- Tenant isolation enforcement
- Input sanitization and payload size limits
- Rate limiting and brute force protection
- Structured logs with correlation IDs
- Auditability for context ingestion and AI usage

## Documentation

- Architecture: [docs/architecture.md](docs/architecture.md)
- Context platform: [docs/direct-context-architecture.md](docs/direct-context-architecture.md)
- Multi-industrial strategy: [docs/multi-industrial-context-platform.md](docs/multi-industrial-context-platform.md)
- Production hardening: [docs/production-readiness.md](docs/production-readiness.md)
- RAG runtime and vector adapters: [docs/rag-vector-runtime.md](docs/rag-vector-runtime.md)
- Multi-cloud infrastructure: [infra/README.md](infra/README.md)

## CI/CD and operations

- CI workflow: `.github/workflows/ci.yml`
- Multi-cloud deploy workflow: `.github/workflows/deploy-multicloud.yml`
- Readiness gate: `npm run readiness:check`
- Test suite: `npm run test:all`
- Security audit: `npm run security:check`

