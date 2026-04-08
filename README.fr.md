# DIRECT - Plateforme Unifiee de Contexte Metier

DIRECT est une plateforme orientee contexte. Elle **ne** sert pas a construire des sites web pour les clients. Elle ingere et unifie le contexte metier de plusieurs sources afin que l'IA raisonne sur les ventes, la finance, les operations et la presence digitale dans une seule couche.

## Industries ciblees

DIRECT est adaptee a:

1. Services B2B et cabinets de conseil
2. Entreprises SaaS et technologiques
3. Retail et e-commerce
4. Cliniques et services de sante prives
5. Education et formation
6. Agences immobilieres et courtiers
7. Hotellerie, restauration et reseaux de services locaux
8. Marques beaute, bien-etre et soins personnels
9. Ventes et services automobiles
10. Equipes de fabrication et distribution

## Ce qui est implemente

1. Connecteurs source: Website Reader, Google Business Profile, CRM, ERP, Finance, Social et Upload Manuel
2. Pipeline d'ingestion du contexte: validation de payload, persistance brute et canonique, fingerprint idempotent, versioning et audit
3. Modele canonique: Customer, Lead, Company, Product, Order, Payment, FinancialRecord, OperationalEvent, Message, WebsitePage, SocialPost, BusinessProfile, Document, FileAsset, Review, Campaign
4. Module Website Reader: homepage, sitemap, metadata SEO, headings, CTAs, navigation, preuves sociales, mots-cles, ton et signaux de positionnement
5. Base de connaissance et retrieval: chunking, embeddings, recherche semantique par tenant
6. Moteur IA contextuel: resume, opportunites, incoherences, suggestions et questions contextuelles
7. Registre d'integrations: statut, curseur, priorite, sante et references de secrets via variables d'environnement
8. API HTTP pour enregistrer, synchroniser, resumer, suggerer et interroger

## Execution

```bash
npm install
npm run direct:build
npm run direct:start
```

URL par defaut: `http://localhost:4300`

## Routes API principales

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## Documentation

Document d'architecture principal: `docs/direct-context-architecture.md`
