# Arquitetura da Plataforma Direct

## 1. Arquitetura Geral
- Plataforma multi-tenant modular construída como monólito bem organizado (Fastify + NestJS-friendly) pronto para evoluir a microserviços. Cada domínio se materializa como plugin Fastify ou service isolado com seu próprio MongoDB, filas (RabbitMQ/NATS) e caches.
- A camada compartilhada (shared/auth, shared/tenant, shared/billing, shared/observability, shared/globalization, shared/ia) hospeda autenticação, autorização, billing, audit, notificações e observabilidade. Ela disponibiliza hooks para a orquestração de módulos.
- O Entry Point (platform-api) registra: auth guard, tenant injector, token-budget manager, Ia orchestrator, feature flag hook, e router para módulos (core, sales, finance, crm, people, sites, academy, local, insight, automate, ai).
- Todos os serviços falam via contratos HTTP/REST + eventos domínio (publicados em exchanges RabbitMQ/NATS). Cada módulo expõe APIs versionadas (/v1/...) e pesquisa (GraphQL/REST) e consome o barramento para atualizações assíncronas.
- Infra global: ambientes distintos por região (BR, LATAM, EUA, EU, APAC) com replicação Mongo/Redis, CDN para assets e serviços de tokens isolados para IA.

## 2. Domínios e Bounded Contexts
| Domínio | Contexto | Serviços principais | Bounded Context | Observações de fronteira |
| --- | --- | --- | --- | --- |
| Direct Core | Identidade multi-tenant | Auth, Tenant, User, Permission, Notification, Audit | Core Platform | apenas expõe contextos globais e meta/planos |
| Direct Sales | Operações comerciais | Lead, Opportunity, Forecast, Reminder, Scoring | Revenue | Eventos: lead.created, opportunity.won |
| Direct Finance | Gestão financeira | Ledger, Cashflow, Receivables, Payables, Pricing, Alerts | Financials | Integrar com Sales/CRM/Billing |
| Direct CRM | Relacionamento | Contact, Company, Segmentation, Enrichment, Profiles | Customer | Compartilha contatos com Sales & Local |
| Direct People | RH & Operações | Team, Onboarding, Processes, Playbooks, Training | PeopleOps | Integra com Core (usuários) e Insight |
| Direct Sites | Presença digital | PageBuilder, Templates, Forms, SEO | Experience | Publicação + CDN + automações (Automate) |
| Direct Academy | Onboarding e treinamento | Lessons, Courses, Onboarding Flows, Help Content | Learning | Exposição IA contextual por módulo |
| Direct Local | Unidades físicas | Location, Schedule, Appointment, Communication | FieldOps | Timezones e multilocais |
| Direct Insight | Inteligência | Metrics, Analytics, Alerts, Reporting | Intelligence | Consome eventos de Sales/Finance/CRM/People |
| Direct Automate | Automação | Workflows, Triggers, Actions, Rule Engine | Automation | Dispara ações em Sales/Finance/CRM etc |
| Direct AI | Assistente inteligente | AI Gateway, Prompt Orchestration, Retrieval | AI Experience | RAG, FAISS, LangChain, controls de tokens |

## 3. Árvore do Repositório
`
/apps
  /platform-api              # fastify entry point e módulos
  /modules                  # (future split) cada módulo como microservice separado
/packages
  /shared                   # bibliotecas de auth, billing, observability, IA, globalization
  /contracts                # DTOs, eventos, schemas
/docs
  /architecture.md
/docker-compose.yml
/README.md
/tsconfig.base.json
`

## 4. Lista de Serviços
1. platform-api: orquestra todos os módulos, autenticação e pipelines de IA.
2. shared/billing: contratos e calculadoras de planos, add-ons, IA e matrizes regionais.
3. shared/auth: JWT+refresh, RBAC+ABAC, token budgets.
4. shared/tenant: resolvers de tenant, locale, moeda, timezone.
5. shared/observability: logs estruturados, métricas (Prometheus) e tracing (OpenTelemetry).
6. shared/globalization: helpers de transcrição, LTR/RTL, formatos de data/moneda.
7. shared/ia: orquestra prompts, RAG, FAISS e budgets.
8. shared/contracts: Zod schemas para comandos, consultas e eventos.

## 5. Lista de Módulos
1. Core
2. Sales
3. Finance
4. CRM
5. People
6. Sites
7. Academy
8. Local
9. Insight
10. Automate
11. AI Assistant

Cada módulo inclui:
- outes/v1/<resource> com controllers
- services (leadService, ledgerService etc.)
- models (coleções MongoDB por serviço)
- events (payloads para RabbitMQ/NATS)
- ui-descriptions (componentes / states)

## 6. O que cada produto entrega ao cliente
- **Core**: onboarding de organizações, autenticação, painel global, notificações, auditoria de atividades e navegação.
- **Sales**: pipeline, scoring, sequências, análise de forecast, recomendações de IA e automações.
- **Finance**: fluxos de caixa, alertas de risco, simulações de preços, projeções e relatórios comparados.
- **CRM**: contatos e empresas, segmentação, 360º do cliente, enriquecimento e histórico.
- **People**: gestão de equipes, onboarding/offboarding, checklists, trilhas de treinamento e playbooks.
- **Sites**: construtor visual, templates, formulários, SEO e publicação com CDN e monitoramento.
- **Academy**: tutoriais, trilhas, conteúdos dinâmicos e contextualizados.
- **Local**: agendamentos, unidades, horários, comunicação local (WhatsApp) e filas.
- **Insight**: dashboards, alertas, comparativos, recomendações e relatórios automatizados.
- **Automate**: workflows, triggers, regras, integrações cross-módulos e log de execuções.
- **AI**: assistente contextual, respostas curtas, cards de ação e explicações por módulo.

## 7. Como cada produto aparece no front-end
- Páginas principais: painel inicial, menu lateral por módulo, profunda navegação global.
- Cada módulo expõe dashboard com KPIs, listas, timeline, widgets IA e CTA.
- Layouts: responsivos, acessíveis (WCAG AA), com estados vazios claros, skeleton loading, filtros (date, tenant, time zone), suporte a LTR/RTL.
- Navegação via menu lateral persistente + breadcrumbs. Componentes reutilizáveis para cards de métrica, timeline, modais e assistente IA.
- Suporte a internacionalização (i18n) via catálogos por locale, substituição de moeda e timezone por tenant/usuário.
- Permissões desenhadas em UI (botões desabilitados, seções ocultas) com base em RBAC/ABAC.

## 8. Como cada produto funciona no back-end
Para cada produto temos:
- Serviços internos com interface clara (ex: leadService.create(tenantId, payload)).
- Banco MongoDB dedicado por módulo, coleções proprietárias.
- Comandos: CreateLeadCommand, UpdateCashflowCommand, ScheduleAppointmentCommand.
- Consultas: ListLeadsQuery, GetPipelineSnapshot, GetFinancialHealthIndicator.
- Eventos: lead.created, opportunity.won, invoice.received, contact.tagged etc.
- Integrações: RabbitMQ/NATS para replicar eventos cruzados, API para billing e notifications.
- Regras: validações com Zod, regras de negócio (ex: pipeline máx. 10 etapas, fluxos financeiros com reconciliações). 
- Auditoria: middleware global registra alteração de dados críticos (CRM, Finance, Billing).
- Fault handling: retries com queue, DLQ, circuit breaker nas integrações IA.
- Segurança: JWT+refresh, RBAC e ABAC (contexto de tenant + role + atributos), rate limiting por tenant/service.

## 9. Estratégia de Infraestrutura
**Mínimo**:
- API Gateway (Fastify) expondo /v1/* + /health.
- MongoDB independente por serviço (ex: direct-sales, direct-finance).
- Redis para caching tokens, sessões e filas leves.
- RabbitMQ/NATS para eventos.
- File storage em volumes (future CDN) ou S3 compat.
- Observabilidade: Pino + OpenTelemetry + Prometheus metrics endpoint.
- Logs estruturados via central (ELK/Cloud).

**Futuro**:
- Auto-scaling baseado em CPU/memory + queue backlog.
- Workers dedicados (insights, automation, IA) em contêineres.
- CDN global para Sites e assets.
- Monitoramento avançado (Loki, Grafana) com alertas.
- Feature flags e ambientes regionais replicados.
- Multi-mongo replicado com write region preferencial + cross region reads.
- Suporte a múltiplas moedas (serviço config global) e region-specific payment gateways.

## 10. Estratégia de Billing
- Planos modulares (Core + Sales/Finance/CRM/People/Sites/Academy/Local/Insight/Automate/AI) com bundles e plano completo.
- Recorrência mensal/anual (1 ano com desconto). Add-ons pay-per-use para IA + automações.
- Pagamentos: cards, Pix, boleto (region-aware; e.g. Pix Brasil, SEPA, ACH) e billing local currency.
- Billing engine recebe eventos 	enant.plan.changed, ia.request, workflow.executed e aplica pricing rules.
- Rate admi: shared/billing fornece price matrix (tiered by tenant size, region, module, token usage). Inclui margem, custo cloud, IA, operations.
- Hooks: illing.company.registered, illing.invoice.paid, illing.overage.alert

## 11. Estratégia de IA
- shared/ia combina LangChain + RAG + FAISS. Cada tenant tem índice FAISS e embeddings versionados.
- AI Gateway controla tokens, budgets, prompt orchestration e fallback (resposta curta vs chat completo).
- Context builder agrega último evento de tenant, quotas, e schema de módulo antes de chamar GPT.
- Retrieval service usa RAG para respostas baseadas em docs e base de conhecimento (Direct Academy, Insight, documentação interna).
- Session memory e tenant memory guardam histórico relevante (com summarization automated via IA). Logs e custo registrados por tenant+ módulo.
- Limites configuráveis por plano; IA degrade para summary/resumo se orçamento esgotado.

## 12. Estratégia de Token Control
- Token budget manager (shared lib) impõe limites por request, usuário, tenant, módulo. Usa Redis para counters e sliding windows.
- Tokens rastreados por tipo de operação (chat vs prompt). Operações repetidas são cacheadas (Hash prompt -> resposta). Tokens evitados via summarization automática (LangChain summarizers) quando context > threshold.
- Auditoria de consumo (ia.tokens.consumed, ia.tokens.overage). Thresholds disparam alertas e degradam para resposta curta.
- Liste: 	oken.request.limit, 	oken.user.limit, 	oken.tenant.limit, 	oken.module.limit, 	oken.monthly.quota.

## 13. Contratos de API
| Endpoint | Método | Descrição | Payload chave |
| --- | --- | --- | --- |
| POST /v1/core/tenants | POST | Cria tenant com locale, currency, timezone | { name, region, timezone, language } |
| GET /v1/core/tenant/:id/status | GET | Status da assinatura | { tenantId } |
| POST /v1/sales/leads | POST | Cria lead | { kotlin } (Zod schema) |
| PATCH /v1/finance/ledger/:id | PATCH | Lança transação | { amount, category, tags } |
| GET /v1/crm/contacts?segment=vip | GET | Lista contatos segmentados | query params |
| POST /v1/automation/workflows/:flowId/execute | POST | Dispara fluxo | { trigger, input } |
| POST /v1/ai/query | POST | Chama assistente | { moduleContext, prompt, tokenBudget } |
| GET /v1/insight/metrics | GET | KPIs filtrados | filters: tenant, module, timezone |

Schemas versionados com Zod e expostos via OpenAPI.

## 14. Eventos de Domínio
1. 	enant.created – disparado após tenant onboard.
2. lead.created, lead.scored, opportunity.advanced, opportunity.won, opportunity.lost.
3. invoice.issued, payment.received, orecast.updated.
4. contact.enriched, contact.tagged, segment.updated.
5. employee.onboarded, process.completed, 	raining.progressed.
6. page.published, orm.submitted, seo.updated.
7. course.completed, help.requested.
8. unit.opened, ppointment.created, service.completed.
9. metric.alert, eport.generated, ecommendation.issued.
10. workflow.executed, 	rigger.fired, utomation.failed.
11. ia.query.started, ia.query.finished, ia.tokens.overage.

## 15. Roadmap por fases
1. **Fase 1**: Arquitetura geral, domínio, árvore, boundaries, modelo de dados (interfaces) e estratégias de billing/globalização/IA/token. Documentação consolidada.
2. **Fase 2**: Scaffold monolito modular, shared services (auth, tenant, billing, observability), Docker Compose, testes base.
3. **Fase 3**: Implementar módulos Sales, Finance, CRM, AI Assistant, RAG/FAISS, token budget.
4. **Fase 4**: Sites, People, Automate, Insight, Academy, Local, operando com automações e workflows.

## 16. Riscos Técnicos e Mitigação
- **Monólito inchado:** mitigado por módulos Fastify em plugins, contratos claros, e pipelines de eventos.
- **Carga de IA:** limites de tokens, cache, summarization, e fallback para respostas curtas.
- **Multi-tenant errado:** tenant resolver central, auditoria e RBAC/ABAC com isolamentos de banco.
- **Billing impreciso:** espejo de eventos, pricing matrix versionada, logs de custo e alertas de margem.
- **Globalização insuficiente:** conteúdo separado, catálogos i18n, suporte LTR/RTL e timezone/locale por tenant.
