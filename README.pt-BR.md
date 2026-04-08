# DIRECT - Plataforma Unificada de Contexto de Negócio

DIRECT é uma plataforma orientada a contexto. Ela não foi feita para construir sites para clientes. Ela ingere, normaliza e unifica o contexto do negócio a partir de múltiplas fontes para que a IA raciocine sobre vendas, financeiro, operação, presença digital e base de conhecimento como uma única operação.

## Indústrias atendidas

DIRECT foi desenhada para atender:

1. Empresas de serviços B2B e consultorias
2. Empresas SaaS e de tecnologia
3. Operações de varejo e e-commerce
4. Clínicas e serviços de saúde privados
5. Empresas de educação e treinamento
6. Imobiliárias e operações de corretagem
7. Hospitalidade, restaurantes e redes de serviços locais
8. Marcas de beleza, bem-estar e cuidados pessoais
9. Operações automotivas de venda e pós-venda
10. Times de manufatura e distribuição

## Baseline implementado

1. Conectores de fonte: Website Reader, Google Business Profile, HubSpot CRM, Stripe Finance, ERP REST, Social RSS/Atom e Upload Manual
2. Pipeline de ingestão de contexto: validação de payload, persistência bruta e canônica, fingerprint idempotente, versionamento de contexto e auditoria
3. Modelo canônico: `Customer`, `Lead`, `Company`, `Product`, `Order`, `Payment`, `FinancialRecord`, `OperationalEvent`, `Message`, `WebsitePage`, `SocialPost`, `BusinessProfile`, `Document`, `FileAsset`, `Review`, `Campaign`
4. Base de conhecimento e runtime RAG: chunking, embeddings, retrieval semântico e reranking
5. Motor de IA contextual: roteamento de modelos, confidence score, perguntas contextuais, tracking de uso e billing por uso estimado
6. Console React: dashboards de industry profile, readiness, execution plan, cobertura de conectores e uso de IA
7. Baseline multi-cloud: AWS, GCP, Azure, Oracle Cloud Infrastructure (OCI) e Railway

## Execução local

```bash
npm ci
npm run platform-api:build
npm run direct:build
npm run console:build
```

URL padrão da Context API: `http://localhost:4300`

## Rotas principais

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

## Documentação

- Arquitetura principal: `docs/architecture.md`
- Plataforma de contexto: `docs/direct-context-architecture.md`
- Prontidão para produção: `docs/production-readiness.md`
- Runtime RAG e vetores: `docs/rag-vector-runtime.md`
- Infra multi-cloud: `infra/README.md`

