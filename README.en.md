# DIRECT - Unified Business Context Platform

DIRECT is a context-first platform. It does **not** build websites for clients. It ingests and unifies business context from multiple sources so AI can reason across sales, financial, operational and digital signals in one place.

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

## What was implemented

1. Source connectors: Website Reader, Google Business Profile, CRM, ERP, Financial, Social, Manual Upload
2. Context ingestion pipeline: payload validation, raw and canonical persistence, idempotent fingerprinting, context versioning, audit logs
3. Canonical model: Customer, Lead, Company, Product, Order, Payment, FinancialRecord, OperationalEvent, Message, WebsitePage, SocialPost, BusinessProfile, Document, FileAsset, Review, Campaign
4. Website Reader module: homepage, sitemap pages, metadata SEO, headings, CTAs, navigation, social proof, keywords, tone and positioning signals
5. Knowledge base and retrieval: chunking, embeddings, tenant-scoped semantic search
6. AI context engine: summary, opportunities, inconsistencies, suggestions, contextual Q&A
7. Integration registry: status, cursor, priority, health and credential-env references
8. HTTP API for register, sync, summary, suggestions and ask

## Run

```bash
npm install
npm run direct:build
npm run direct:start
```

Default server URL: `http://localhost:4300`

## Key API routes

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## Documentation

Main architecture doc: `docs/direct-context-architecture.md`
