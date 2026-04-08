# DIRECT Multi-Industrial Context Platform

## What the platform needs

DIRECT needs five production pillars:

1. A canonical context layer that normalizes sales, finance, operations, digital presence, files and relationship signals per tenant.
2. A task and model routing layer that decides when to use lightweight AI, deep reasoning, retrieval or automation.
3. A connector registry that knows coverage, health, credentials state and missing domains for each tenant.
4. Industry packs that convert raw context into vertical KPIs, execution priorities and connector recommendations.
5. A value loop that measures readiness, detects gaps, suggests actions and improves data quality before increasing AI spend.

## What is now implemented in code

- `src/models/canonical.ts`
  - canonical entities now carry business domains, industry hints, relationships, signals, quality score and source metadata.
- `src/ingestion/context-normalizer.ts`
  - records are enriched with domain coverage, industry hints, quality score and relationship edges.
- `src/industry/industry-intelligence.ts`
  - multi-industry assessment, readiness scoring, KPI packs and execution plan generation.
- `src/ai/model-router.ts`
  - AI workflow routing for classification, extraction, diagnosis, planning, retrieval, chat and automation.
- `src/ai/ai-context-engine.ts`
  - tenant summary now includes industry profile, data readiness, connector coverage and business metrics.
- `src/api/server.ts`
  - new endpoints:
    - `GET /api/tenants/:tenantId/context/industry`
    - `GET /api/tenants/:tenantId/context/readiness`
    - `GET /api/tenants/:tenantId/context/execution-plan`
    - `GET /api/tenants/:tenantId/connectors/recommendations`

## Industry strategy

DIRECT now ships baseline packs for:

- `general`
- `professional_services`
- `local_services`
- `retail_ecommerce`
- `healthcare`
- `education`
- `real_estate`
- `manufacturing_b2b`

Each pack defines:

- dominant signals
- required business domains
- recommended connectors
- KPI focus
- execution priorities

## AI model strategy

The platform should not use one model for everything.

- `economy`
  - classification, tagging, extraction, light summaries
- `balanced`
  - grounded tenant Q&A, contextual copilots, standard recommendations
- `reasoning`
  - diagnosis, planning, cross-domain executive analysis

Routing uses:

- task type
- tenant readiness score
- industry risk profile
- short response mode for token control

## Security and governance baseline

To become global and multi-industrial, DIRECT still needs these production controls connected to all deployments:

- tenant isolation at storage, vector, cache and API layers
- RBAC and ABAC on every tenant resource
- audit logging for reads, writes, exports and AI actions
- PII masking and retention policy
- secrets management outside source code
- approval gates for AI-triggered actions
- regional compliance strategy for LGPD and GDPR

## Next execution steps

1. Replace stubs with production connectors for the highest-value verticals.
2. Move vector search from local/file mode to managed FAISS-compatible or vector DB infrastructure.
3. Add reranking and confidence scoring to every grounded answer.
4. Connect billing to usage events from AI routing, retrieval and automation.
5. Surface industry readiness and execution plans in the React frontend.
