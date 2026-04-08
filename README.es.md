# DIRECT - Plataforma Unificada de Contexto Empresarial

DIRECT es una plataforma orientada al contexto. No fue creada para construir sitios web para clientes. Ingiere, normaliza y unifica el contexto del negocio desde múltiples fuentes para que la IA razone sobre ventas, finanzas, operaciones, presencia digital y conocimiento como una sola operación.

## Industrias atendidas

DIRECT está preparada para:

1. Empresas de servicios B2B y consultorías
2. Empresas SaaS y de tecnología
3. Operaciones de retail y comercio electrónico
4. Clínicas y servicios de salud privados
5. Negocios de educación y capacitación
6. Inmobiliarias y brokers
7. Hospitalidad, restaurantes y cadenas de servicios locales
8. Marcas de belleza, bienestar y cuidado personal
9. Operaciones automotrices de venta y posventa
10. Equipos de manufactura y distribución

## Baseline implementado

1. Conectores de fuente: Website Reader, Google Business Profile, HubSpot CRM, Stripe Finance, ERP REST, Social RSS/Atom y Carga Manual
2. Pipeline de ingesta de contexto: validación de payload, persistencia bruta y canónica, fingerprint idempotente, versionado de contexto y auditoría
3. Modelo canónico: `Customer`, `Lead`, `Company`, `Product`, `Order`, `Payment`, `FinancialRecord`, `OperationalEvent`, `Message`, `WebsitePage`, `SocialPost`, `BusinessProfile`, `Document`, `FileAsset`, `Review`, `Campaign`
4. Base de conocimiento y runtime RAG: chunking, embeddings, retrieval semántico y reranking
5. Motor de IA contextual: enrutamiento de modelos, confidence score, preguntas contextuales, tracking de uso y billing estimado por uso
6. Consola React: dashboards de industry profile, readiness, execution plan, cobertura de conectores y uso de IA
7. Baseline multi-cloud: AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) y Railway

## Ejecución local

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

URL por defecto de la Context API: `http://localhost:4300`

## Rutas principales

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

## Documentación

- Arquitectura principal: `docs/architecture.md`
- Plataforma de contexto: `docs/direct-context-architecture.md`
- Preparación para producción: `docs/production-readiness.md`
- Runtime RAG y vectores: `docs/rag-vector-runtime.md`
- Infra multi-cloud: `infra/README.md`

