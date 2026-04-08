# DIRECT - Plataforma Unificada de Contexto Empresarial

DIRECT es una plataforma orientada al contexto. **No** esta enfocada en crear sitios web para clientes. Ingiere y unifica contexto empresarial desde multiples fuentes para que la IA razone sobre ventas, finanzas, operaciones y presencia digital en un solo lugar.

## Industrias atendidas

DIRECT esta preparada para:

1. Empresas de servicios B2B y consultorias
2. Empresas SaaS y de tecnologia
3. Operaciones de retail y comercio electronico
4. Clinicas y servicios de salud privados
5. Negocios de educacion y capacitacion
6. Inmobiliarias y brokers
7. Hospitalidad, restaurantes y cadenas de servicios locales
8. Marcas de belleza, bienestar y cuidado personal
9. Operaciones automotrices de venta y posventa
10. Equipos de manufactura y distribucion

## Que se implemento

1. Conectores de fuente: Website Reader, Google Business Profile, CRM, ERP, Financiero, Social y Carga Manual
2. Pipeline de ingesta de contexto: validacion de payload, persistencia cruda y canonica, fingerprint idempotente, versionado de contexto y auditoria
3. Modelo canonico: Customer, Lead, Company, Product, Order, Payment, FinancialRecord, OperationalEvent, Message, WebsitePage, SocialPost, BusinessProfile, Document, FileAsset, Review y Campaign
4. Modulo Website Reader: homepage, paginas de sitemap, metadata SEO, headings, CTAs, navegacion, prueba social, keywords, tono y posicionamiento
5. Base de conocimiento y retrieval: chunking, embeddings y busqueda semantica por tenant
6. Motor de IA contextual: resumen, oportunidades, inconsistencias, sugerencias y preguntas contextuales
7. Registro de integraciones: estado, cursor, prioridad, salud y referencias de credenciales por variable de entorno
8. API HTTP para registrar, sincronizar, resumir, sugerir y consultar

## Ejecucion

```bash
npm install
npm run direct:build
npm run direct:start
```

URL por defecto: `http://localhost:4300`

## Rutas principales

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## Documentacion

Documento principal de arquitectura: `docs/direct-context-architecture.md`
