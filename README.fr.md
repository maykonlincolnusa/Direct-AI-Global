# DIRECT - Plateforme Unifiée de Contexte Métier

DIRECT est une plateforme orientée contexte. Elle n'a pas été conçue pour créer des sites web pour les clients. Elle ingère, normalise et unifie le contexte métier depuis plusieurs sources afin que l'IA raisonne sur les ventes, la finance, les opérations, la présence digitale et la base de connaissance comme un seul business.

## Industries ciblées

DIRECT est adaptée à :

1. Services B2B et cabinets de conseil
2. Entreprises SaaS et technologiques
3. Retail et e-commerce
4. Cliniques et services de santé privés
5. Éducation et formation
6. Agences immobilières et courtiers
7. Hôtellerie, restauration et réseaux de services locaux
8. Marques beauté, bien-être et soins personnels
9. Ventes et services automobiles
10. Équipes de fabrication et distribution

## Baseline implémenté

1. Connecteurs source : Website Reader, Google Business Profile, HubSpot CRM, Stripe Finance, ERP REST, Social RSS/Atom et Upload Manuel
2. Pipeline d'ingestion du contexte : validation de payload, persistance brute et canonique, fingerprint idempotent, versioning du contexte et audit
3. Modèle canonique : `Customer`, `Lead`, `Company`, `Product`, `Order`, `Payment`, `FinancialRecord`, `OperationalEvent`, `Message`, `WebsitePage`, `SocialPost`, `BusinessProfile`, `Document`, `FileAsset`, `Review`, `Campaign`
4. Base de connaissance et runtime RAG : chunking, embeddings, retrieval sémantique et reranking
5. Moteur IA contextuel : routage de modèles, confidence score, questions contextuelles, suivi d'usage et billing estimatif à l'usage
6. Console React : dashboards pour industry profile, readiness, execution plan, couverture des connecteurs et usage IA
7. Baseline multi-cloud : AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) et Railway

## Exécution locale

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

URL par défaut de la Context API : `http://localhost:4300`

## Routes principales

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

- Architecture principale : `docs/architecture.md`
- Plateforme de contexte : `docs/direct-context-architecture.md`
- Préparation production : `docs/production-readiness.md`
- Runtime RAG et vecteurs : `docs/rag-vector-runtime.md`
- Infra multi-cloud : `infra/README.md`

