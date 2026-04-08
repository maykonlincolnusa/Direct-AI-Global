# Plataforma Direct: Arquitetura Global & Plano de Implementação

Este documento define a arquitetura, estrutura de serviços, fluxos de dados, estratégias de IA e monetização para a Plataforma **Direct**, além de fornecer o roteiro de execução em fases.

---

## 1. Arquitetura Proposta e Mapa de Domínios (Bounded Contexts)

A plataforma será construída utilizando o padrão de **Monólito Modular** (preparado para **Microserviços**) gerenciado em um **Monorepo** (ex: Turborepo).

*   **Padrão Arquitetural**: Event-Driven Architecture (EDA) & API Gateway Pattern.
*   **Isolamento de Dados**: Database-per-service (MongoDB isolado por domínio). Coleções não se comunicam diretamente; serviços se conversam via API interna (síncrono) ou Message Broker (assíncrono).
*   **Multi-tenancy**: Todo dado possuirá `tenantId`. O contexto do tenant é injetado via API Gateway ou middlewares.
*   **Globalização (i18n, l10n)**: Dicionários de texto separados (ex: `next-intl`), armazenando datas em UTC e delegando a formatação (timezone, moeda) para o cliente considerando as preferências do tenant/usuário.

### Mapa de Domínios
*   **Shared / Core Domain**: Identity, Tenant, Billing, Audit.
*   **Business Domains**: CRM, Sales, Finance, People, Sites, Local, Academy.
*   **Intelligence & Orchestration Domain**: AI Gateway, Automate, Insight.

---

## 2. Lista de Módulos (Produtos)

### Produtos Principais (Comerciais)
1.  **Direct Core**: Gestão da conta, usuários, roles, notificações e estrutura base.
2.  **Direct Sales**: Funil, CRM comercial, automação de vendas.
3.  **Direct Finance**: Contas a pagar/receber, fluxo de caixa, DRE gerencial.
4.  **Direct CRM**: Relacionamento, segmentação e visão 360 do cliente.
5.  **Direct People**: Gestão de equipe, onboarding, manuais e produtividade.
6.  **Direct Sites**: Construtor visual de LPs e páginas institucionais.
7.  **Direct Academy**: LMS embedded para treinamento de clientes e equipes.
8.  **Direct Local**: Gestão de agenda, filas e múltiplas filiais (franquias/lojas).
9.  **Direct Insight**: BI, KPIs unificados, alertas e dashboards executivos.
10. **Direct Automate**: Motor de workflows (iPaaS interno).
11. **Direct AI / Assistant**: Orquestrador inteligente, embeddings e context manager.

### Produtos de Validação e Comunidade (Gratuitos)
12. **Ezer**: Canvas/Planner básico para pequenos negócios.
13. **Chefe**: To-do list e lembretes com assistente simples.
14. **Kairos**: Agendador e criador de pautas para redes sociais.
15. **Yafa**: Planejador e banco de campanhas para setor de beleza.

---

## 3, 4 e 5. Funcionalidades, Front-end e Back-end (Por Produto)

### 1. DIRECT CORE
*   **Funcionalidades**: Login, multi-fator de autenticação (MFA), gestão de locatários (tenants), convites, configuração global de moedas e timezones, auditoria, central de notificações.
*   **Interface (Front-end)**: Tela de login e signup globais, dashboard de boas-vindas. Menu lateral dinâmico baseado em módulos ativos e permissões (RBAC). Painéis de painel de controle da assinatura. Formatar moedas e layouts (RTL/LTR) de acordo com locale do usuário.
*   **Serviços (Back-end)**: `auth-service`, `tenant-service`, `notification-service`, `audit-service`.
*   **Dados**: Banco MongoDB central para Identidade e Configurações Globais.

### 2. DIRECT SALES
*   **Funcionalidades**: Pipeline (Kanban), captura automatizada de leads, lead scoring, scripts, lembretes de follow-up e previsão de faturamento (Forecast).
*   **Interface (Front-end)**: Kanban boards flúidos. Drawer lateral para detalhes do lead, timeline de atividades. Cards de métricas rápidas. Widget de sugestão de próxima ação alimentado por IA.
*   **Serviços (Back-end)**: `sales-service`, `opportunity-service`. Escuta eventos de formulários do _Direct Sites_ e interações do _Direct CRM_.
*   **Dados**: Coleções de `leads`, `opportunities`, `pipelines`.

### 3. DIRECT FINANCE
*   **Funcionalidades**: Entrada/saída, conciliação, controle de margem, plano de contas, DRE gerencial, alertas de fluxo de caixa negativo.
*   **Interface (Front-end)**: Gráficos de barra/linha para fluxo de caixa. Tabelas datagrid com filtros para contas. Alertas vermelhos para riscos preditivos.
*   **Serviços (Back-end)**: `finance-service` (ledger), `billing-hooks`. Dispara eventos em pagamentos atrasados.
*   **Dados**: Bancos transacionais rígidos, com validação severa de lançamentos (`ledger-entries`, `payables`, `receivables`).

### 4. DIRECT CRM
*   **Funcionalidades**: Cadastro unificado de clientes/B2B, segmentação (tags), histórico omni-channel, enriquecimento de dados.
*   **Interface (Front-end)**: Tabela de clientes robusta. Tela de "Visão 360" agrupando tickets, compras (Finance/Sales), e acessos.
*   **Serviços (Back-end)**: `crm-service`. Agregador de perfil do cliente que faz fan-out/fan-in de dados de outros serviços via cache/events.

### 5. DIRECT PEOPLE
*   **Funcionalidades**: Diretório da equipe, controle de onboarding (checklists), centro primário de SOPs (Standard Operating Procedures).
*   **Interface (Front-end)**: Organograma visual, cards de membros, kanban interno para tarefas operacionais.
*   **Serviços (Back-end)**: `people-service`, `task-service`, `playbook-service`.

### 6. DIRECT SITES
*   **Funcionalidades**: Drag-and-drop builder, publicação rápida, formulários embutidos.
*   **Interface (Front-end)**: Builder visual isolado (Canvas), lista de LPs publicadas, preview em iframes ou janelas isoladas.
*   **Serviços (Back-end)**: `page-builder-service`. Assets guardados em um storage S3-like distribuído globalmente (CDN). Geração de SSG/ISR para o front voltado para o cliente final.

### 7. DIRECT ACADEMY
*   **Funcionalidades**: Trilhas de aulas, manuais do sistema, acompanhamento de progresso.
*   **Interface (Front-end)**: UI orientada a consumo de conteúdo em vídeo/texto, mini-quizzes, barra de progresso.
*   **Serviços (Back-end)**: `learning-service`. Monitora eventos de "conclusão de módulo".

### 8. DIRECT LOCAL
*   **Funcionalidades**: Agendamentos integrados, multfiliais locais, gestão de horários operacionais.
*   **Interface (Front-end)**: Visualização em formato de Calendário (dia/semana/mês), mapa de filiais, painel de capacidade (slots disponíveis).
*   **Serviços (Back-end)**: `schedule-service`, `booking-service` (lida pesadamente com conversões de timezone dependendo da localização da filial).

### 9. DIRECT INSIGHT
*   **Funcionalidades**: Painéis C-Level unificando Sales, Finance, CRM e Marketing. 
*   **Interface (Front-end)**: Dashboards com gráficos flexíveis (Recharts ou Chart.js), geração de PDFs.
*   **Serviços (Back-end)**: `insight-service` e Data Aggregator. Consome eventos de todos os outros módulos de forma puramente assíncrona, montando visões materializadas para leitura rápida (Read-heavy).

### 10. DIRECT AUTOMATE
*   **Funcionalidades**: Zappier/Make interno. Triggers ("Ao receber um lead") -> Actions ("Mande para Direct CRM e adicione em Direct Finance").
*   **Interface (Front-end)**: Node-based visual editor (ex: React Flow) para desenhar os workflows.
*   **Serviços (Back-end)**: `workflow-engine-service`. Serviço robusto de Background Jobs (ex: BullMQ) garantindo idempotência e dead-letter queues (DLQs).

### 11. DIRECT AI / ASSISTANT
*   **Funcionalidades**: AI Gateway, chat flutuante de negócio, summarização de dados, análise de contexto por página visualizada.
*   **Interface (Front-end)**: Modal ou drawer flutuante unificado e persistente de estado.
*   **Serviços (Back-end)**: `ai-gateway-service`, RAG Pipeline.

### Produtos Gratuitos (Ezer, Chefe, Kairos, Yafa)
Pequenos microsserviços agrupados logicamente que utilizam os mesmos conceitos de tenant e design system da marca mãe, mas com bancos de dados muito menores e sem dependências com os módulos premium. Operam também como funis de aquisição para o Direct Core.

---

## 6. Estratégia de Infraestrutura

**Minimum Viable Architecture (Infra Inicial):**
*   **Hospedagem API**: Containers no Railway, Render, ou AWS App Runner / Azure Container Apps.
*   **Gateway**: Nginx / Kong, ou apenas o Ingress do provedor.
*   **Database**: MongoDB Atlas (Cloud) Serverless ou Shared clusters por enquanto, com logical databases para isolamento inicial (um DB por serviço).
*   **Caching/Queues**: Redis Cloud Upstash (Serverless) para Rate Limiting e filas leves (BullMQ).
*   **Storage**: AWS S3.

**Infraestrutura Escalável Global (Futura):**
*   **Orquestração**: Kubernetes (EKS / AKS) com multi-az e réplicas por nó (HPA habilitado).
*   **Broker Assíncrono**: Kafka ou RabbitMQ clusterizado em vez de Redis para alta retenção.
*   **Bancos de Dados**: MongoDB Atlas Dedicated, regiões diferentes.
*   **Front-end Edge**: Vercel ou Cloudflare Pages + Edge Functions, distribuído em múltiplas edge networks globalmente para menor latência nas UI.

---

## 7. Estratégia de Billing e Pricing

*   **Gateway de Pagamento**: Stripe (Global) e Pagar.me ou Asaas (Brasil - Pix/Boleto).
*   **Modularidade de Preço**: O plano do usuário será um array de permissões mapeado para chaves de produtos no Stripe (ex: `price_1_salas`, `price_2_finance`, ou `price_bundle_full`).
*   **Estratégia Backend (`billing-service`)**:
    *   Sincronização Server-to-Server via Webhooks (Stripe -> Webhook -> Atualiza plano no DB).
    *   Add-ons: O consumo de integrações ou automações avulsas deve ser enviado ao Stripe como metered usage.

---

## 8. Estratégia de Inteligência Artificial (Arquiteta & RAG)

*   **Camada de Aplicação**: LangChain.js rodando no `ai-gateway-service`.
*   **Modelo e Gateway**: Chamadas centralizadas para LLMs (OpenAI, Claude) nunca devem ser feitas diretamente pelo front ou módulos aleatórios, apenas pelo AI Gateway.
*   **RAG & FAISS**: Utilização de FAISS ou Pinecone para bancos vetoriais.
    *   **Isolamento**: Cada tenant possui seus próprios namespaces dentro do Vector DB para prevenir vazamento de dados inter-locatários.
*   **Contexto Dinâmico**: O RAG vai possuir dois pools. 1. *Conhecimento da Plataforma* (guias, de uso comum) e 2. *Dados Operacionais do Tenant* (suas métricas, seus leads, etc).

---

## 9. Estratégia de Token Control e Custos

Para proteger as margens dos Planos do Sistema e evitar abusos:
1.  **Orçamento Baseado em Plano**: Cada subscription tier concederá "Direct Credits" por mês (Ex: 10.000 créditos = X Tokens calculados internamente).
2.  **Tracking e Interceptação**: Toda requisição originada no Front-end para a IA deve passar via API Gateway, interceptar e descontar da cota no Redis (In-memory, super rápido). O usuário é bloqueado com erro *429 Too Many Requests* caso estoure.
3.  **Economia (Token Saving)**: 
    *   Cache Semântico (se um usuário faz a mesma pergunta repetida, responde do Redis, custo Zero).
    *   Evitar injeção de todo o CRM na prompt. A IA busca via funções apenas os chunks sumarizados ou dados agregados (Insight Module) necessários para o usuário.

---

## 10. Roadmap de Implementação em Fases

### Fase 1 (Semana Atual) - Arquitetura, Mapas e Setup
*   Aprovação do desenho e contratos.
*   Criação da estrutura de pastas (Turborepo).
*   Mockup de decisões, repositório de documentação, inicialização do ESLint/Prettier/Jest.

### Fase 2 - O Core e Bootstrap (Semana 2 e 3)
*   **Infra**: Docker Compose local com MongoDB e Redis. Variáveis de ambiente isoladas.
*   **Shared/Core**: Desenvolvimento do `auth-service` (login, JWT, RBAC), `tenant-service` (criação de workspaces).
*   **Frontend Base**: Shell da aplicação em Next.js (Sidebar dinâmica, topbar, thema).

### Fase 3 - O Coração Comercial & Inteligência (Semana 4 a 6)
*   **Módulos**: Desenvolvimento de `Direct Sales`, `Direct Finance` e `Direct CRM`. Estes provam o valor inicial.
*   **IA**: Implementação inicial do `ai-gateway`, gestão de tokens, e RAG voltado para suporte ao Sales Dashboard.

### Fase 4 - Expansão do Ecossistema (Semana 7+)
*   **Módulos Adicionais**: `Direct Sites`, `Direct People`, `Direct Automate`, `Direct Insight`, `Direct Local`, `Direct Academy`.
*   **Produtos Gratuitos**: Spin-offs reaproveitando a biblioteca de componentes visuais do ecossistema pai.

---

## Próximos Passos recomendados

1. Por favor, **aprove** esta estrutura e planejamento macro.
2. Após aprovação, iniciaremos imediatamente a Fase 2: **Configurando a Árvore de Diretórios (Monorepo), instalando as ferramentas e criando a infra de docker-compose base para desenvolvimento**.
