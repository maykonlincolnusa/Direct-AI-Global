# DIRECT - Plataforma Unificada de Contexto de Negocio

DIRECT e uma plataforma orientada a contexto. Ela **nao** foi feita para construir sites para clientes. Ela captura e unifica o contexto de negocio de varias fontes para que a IA raciocine sobre vendas, financeiro, operacao e presenca digital em um unico lugar.

## Industrias atendidas

DIRECT foi desenhada para atender:

1. Empresas de servicos B2B e consultorias
2. Empresas SaaS e de tecnologia
3. Operacoes de varejo e e-commerce
4. Clinicas e servicos de saude privados
5. Empresas de educacao e treinamento
6. Imobiliarias e operacoes de corretagem
7. Hospitalidade, restaurantes e redes de servicos locais
8. Marcas de beleza, bem-estar e cuidados pessoais
9. Operacoes automotivas de venda e pos-venda
10. Times de manufatura e distribuicao

## O que foi implementado

1. Conectores de fonte: Website Reader, Google Business Profile, CRM, ERP, Financeiro, Social e Upload Manual
2. Pipeline de ingestao de contexto: validacao de payload, persistencia bruta e canonica, fingerprint idempotente, versionamento e auditoria
3. Modelo canonico: Customer, Lead, Company, Product, Order, Payment, FinancialRecord, OperationalEvent, Message, WebsitePage, SocialPost, BusinessProfile, Document, FileAsset, Review e Campaign
4. Modulo Website Reader: homepage, sitemap, metadata SEO, headings, CTAs, navegacao, prova social, palavras-chave, tom e sinais de posicionamento
5. Base de conhecimento e retrieval: chunking, embeddings e busca semantica por tenant
6. Motor de IA contextual: resumo, oportunidades, inconsistencias, sugestoes e perguntas contextuais
7. Registro de integracoes: status, cursor, prioridade, saude e referencias de credenciais por variavel de ambiente
8. API HTTP para registrar, sincronizar, resumir, sugerir e perguntar

## Execucao

```bash
npm install
npm run direct:build
npm run direct:start
```

URL padrao do servidor: `http://localhost:4300`

## Rotas principais

1. `GET /health`
2. `POST /api/tenants/:tenantId/connectors/register`
3. `POST /api/tenants/:tenantId/sync/:connectorType`
4. `GET /api/tenants/:tenantId/connectors`
5. `GET /api/tenants/:tenantId/context/summary`
6. `GET /api/tenants/:tenantId/context/suggestions`
7. `POST /api/tenants/:tenantId/context/ask`

## Documentacao

Documento principal de arquitetura: `docs/direct-context-architecture.md`
