# DIRECT - Unified Business Context Platform

DIRECT is a context-first platform. It does not build websites for clients. It ingests and unifies business context from multiple systems so AI can reason across sales, finance, operations, digital presence and knowledge assets as one business.

## Industries served

DIRECT is designed for:

1. B2B services and consulting firms
2. SaaS and technology companies
3. Retail and e-commerce operations
4. Healthcare clinics and private practices
5. Education and training businesses
6. Real estate agencies and brokerages
7. Hospitality, restaurants and local service chains
8. Beauty, wellness and personal care brands
9. Automotive sales and aftersales operations
10. Manufacturing and distribution teams

## Implemented baseline

1. Source connectors: Website Reader, Google Business Profile, HubSpot CRM, Stripe Finance, ERP REST, Social RSS/Atom and Manual Upload
2. Context ingestion pipeline: payload validation, raw and canonical persistence, idempotent fingerprinting, context versioning and audit logs
3. Canonical model: `Customer`, `Lead`, `Company`, `Product`, `Order`, `Payment`, `FinancialRecord`, `OperationalEvent`, `Message`, `WebsitePage`, `SocialPost`, `BusinessProfile`, `Document`, `FileAsset`, `Review`, `Campaign`
4. Knowledge base and RAG runtime: chunking, embeddings, semantic retrieval and reranking
5. AI context engine: model routing, confidence score, contextual Q&A, usage tracking and usage-based billing estimates
6. React console: dashboards for industry profile, readiness, execution plan, connector coverage and AI usage
7. Multi-cloud baseline: AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) and Railway

## Run locally

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

Context API default URL: `http://localhost:4300`

## Core API routes

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

## Documentation

- Main architecture: `docs/architecture.md`
- Context platform: `docs/direct-context-architecture.md`
- Production readiness: `docs/production-readiness.md`
- RAG and vector runtime: `docs/rag-vector-runtime.md`
- Multi-cloud infra: `infra/README.md`

