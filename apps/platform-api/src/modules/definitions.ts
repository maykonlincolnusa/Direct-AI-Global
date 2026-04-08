import type { BackendSurface, FrontendSurface, ModuleDefinition } from './module-factory.js';

const baseFrontend = (home: string, dashboards: string[]): FrontendSurface => ({
  home,
  dashboards,
  menus: ['Acesso rápido', 'Módulos ativos', 'Ajuda'],
  filters: ['tenant', 'module', 'region'],
  states: {
    empty: 'Sem dados disponíveis',
    loading: 'Carregando informações'
  }
});

const coreBackend = (): BackendSurface => ({
  services: ['AuthService', 'TenantService', 'PermissionService', 'NotificationService', 'AuditLogService'],
  collections: ['tenants', 'users', 'roles', 'notifications', 'auditLogs'],
  commands: ['create-tenant', 'update-plan', 'notify-users', 'refresh-credentials'],
  events: ['tenant.created', 'tenant.updated', 'user.invited', 'plan.changed', 'audit.logged'],
  integrations: ['billing', 'observability', 'notifications']
});

export const moduleDefinitions: ModuleDefinition[] = [
  {
    key: 'core',
    name: 'Direct Core',
    description: 'Base multi-tenant, auth, configurações e centro de navegação.',
    prefix: '/core',
    frontEnd: baseFrontend('dashboard', ['panorama', 'atividade recente']),
    backEnd: coreBackend(),
    billing: { plan: 'core', includeIA: false },
    iaHooks: ['core.navigation', 'core.planStatus'],
    tokenBudget: 400
  },
  {
    key: 'sales',
    name: 'Direct Sales',
    description: 'Pipeline visual, scoring, follow ups e recomendações IA.',
    prefix: '/sales',
    frontEnd: baseFrontend('pipeline', ['forecast', 'metas']),
    backEnd: {
      services: ['LeadService', 'OpportunityService', 'PipelineService', 'ForecastService', 'ScoringEngine', 'ReminderEngine'],
      collections: ['leads', 'opportunities', 'followUps', 'tasks', 'scripts', 'salesNotes'],
      commands: ['capture-lead', 'advance-opportunity', 'apply-forecast', 'trigger-sequence'],
      events: ['lead.created', 'lead.scored', 'opportunity.advanced', 'opportunity.won', 'opportunity.lost', 'forecast.updated'],
      integrations: ['crm', 'automation', 'notifications', 'insight']
    },
    billing: { plan: 'sales', includeIA: true, addon: 'ai-assistant' },
    iaHooks: ['sales.nextAction', 'sales.priorityLead'],
    tokenBudget: 700
  },
  {
    key: 'finance',
    name: 'Direct Finance',
    description: 'Controle de caixa, contas a pagar/receber, metas e alertas.',
    prefix: '/finance',
    frontEnd: baseFrontend('fluxo-de-caixa', ['saude-financeira', 'alertas']),
    backEnd: {
      services: ['LedgerService', 'CashflowService', 'ReceivablesService', 'PayablesService', 'PricingCalculator', 'ProjectionEngine', 'AlertRulesEngine'],
      collections: ['ledgers', 'transactions', 'invoices', 'scheduledPayments', 'projections', 'financialAlerts'],
      commands: ['post-transaction', 'close-period', 'run-simulation', 'raise-alert'],
      events: ['invoice.issued', 'payment.received', 'forecast.updated', 'risk.alert'],
      integrations: ['billing', 'sales', 'insight', 'automation']
    },
    billing: { plan: 'finance', includeIA: true },
    iaHooks: ['finance.pricing', 'finance.alerts'],
    tokenBudget: 650
  },
  {
    key: 'crm',
    name: 'Direct CRM',
    description: 'Cadastro rico de contatos, segmentação e visão 360 graus.',
    prefix: '/crm',
    frontEnd: baseFrontend('contatos', ['timeline', 'segmentos']),
    backEnd: {
      services: ['ContactService', 'CompanyService', 'TaggingService', 'SegmentationService', 'EnrichmentService', 'ProfileAggregator'],
      collections: ['contacts', 'companies', 'segments', 'enrichments', 'profiles'],
      commands: ['add-contact', 'enrich-contact', 'segment-update', 'sync-company'],
      events: ['contact.enriched', 'contact.tagged', 'segment.updated', 'company.updated'],
      integrations: ['sales', 'local', 'automation']
    },
    billing: { plan: 'crm', includeIA: true },
    iaHooks: ['crm.customerNarrative', 'crm.upskill'],
    tokenBudget: 550
  },
  {
    key: 'people',
    name: 'Direct People',
    description: 'Operações de pessoas, onboarding, processos e trilhas.',
    prefix: '/people',
    frontEnd: baseFrontend('equipe', ['rotinas', 'produtividade']),
    backEnd: {
      services: ['TeamService', 'OnboardingService', 'TaskService', 'ProcessService', 'PlaybookService', 'TrainingService', 'ProductivityTracking'],
      collections: ['employees', 'playbooks', 'onboarding', 'tasks', 'trainingProgress'],
      commands: ['onboard-employee', 'assign-task', 'start-trilha', 'archive-playbook'],
      events: ['employee.onboarded', 'process.completed', 'training.progressed', 'task.completed'],
      integrations: ['auth', 'insight', 'academy']
    },
    billing: { plan: 'people', includeIA: true },
    iaHooks: ['people.cultureReminder', 'people.productivityTip'],
    tokenBudget: 500
  },
  {
    key: 'sites',
    name: 'Direct Sites',
    description: 'Construtor de páginas, formulários e capturas com publicação rápida.',
    prefix: '/sites',
    frontEnd: baseFrontend('pages', ['templates', 'forms']),
    backEnd: {
      services: ['PageBuilderService', 'TemplateService', 'FormService', 'PublishService', 'SeoMetadataService', 'AssetManagement'],
      collections: ['pages', 'templates', 'forms', 'assets', 'publishingLogs'],
      commands: ['create-page', 'publish-page', 'version-page'],
      events: ['page.published', 'form.submitted', 'seo.updated'],
      integrations: ['cdn', 'automation', 'insight', 'crm']
    },
    billing: { plan: 'sites', includeIA: false },
    iaHooks: ['sites.seoTip', 'sites.campaignIdea'],
    tokenBudget: 450
  },
  {
    key: 'academy',
    name: 'Direct Academy',
    description: 'Conteúdo de aprendizado, cursos, tutoriais e ajuda contextual.',
    prefix: '/academy',
    frontEnd: baseFrontend('trilhas', ['desempenho', 'progresso']),
    backEnd: {
      services: ['LessonService', 'CourseService', 'OnboardingFlowService', 'ProgressTrackingService', 'HelpContentService'],
      collections: ['courses', 'lessons', 'progress', 'helpRequests'],
      commands: ['create-course', 'track-lesson', 'publish-playbook'],
      events: ['course.completed', 'help.requested', 'playbook.updated'],
      integrations: ['people', 'modules', 'ia']
    },
    billing: { plan: 'academy', includeIA: true },
    iaHooks: ['academy.helpCard', 'academy.nextLesson'],
    tokenBudget: 500
  },
  {
    key: 'local',
    name: 'Direct Local',
    description: 'Agenda, unidades, serviços e comunicação local para operações físicas.',
    prefix: '/local',
    frontEnd: baseFrontend('unidades', ['agenda', 'contato']),
    backEnd: {
      services: ['LocationService', 'ScheduleService', 'AppointmentService', 'UnitService', 'ServiceAreaService', 'LocalCommunicationService'],
      collections: ['units', 'schedules', 'appointments', 'serviceAreas', 'localLogs'],
      commands: ['schedule-appointment', 'check-in', 'notify-unit'],
      events: ['unit.opened', 'appointment.created', 'service.completed', 'confirmation.sent'],
      integrations: ['crm', 'notifications', 'sales', 'automation']
    },
    billing: { plan: 'local', includeIA: false },
    iaHooks: ['local.slotRecommendation', 'local.staffAlert'],
    tokenBudget: 450
  },
  {
    key: 'insight',
    name: 'Direct Insight',
    description: 'Dashboards, KPIs, alertas inteligentes e comparativos executivos.',
    prefix: '/insight',
    frontEnd: baseFrontend('dashboards', ['kpis', 'alertas']),
    backEnd: {
      services: ['MetricsService', 'AnalyticsService', 'AlertEngine', 'ReportingService', 'KpiAggregation', 'RecommendationEngine'],
      collections: ['metrics', 'alerts', 'reports', 'recommendations'],
      commands: ['run-dashboard', 'create-alert', 'issue-report', 'execute-recommendation'],
      events: ['metric.alert', 'report.generated', 'recommendation.issued'],
      integrations: ['sales', 'finance', 'crm', 'automation', 'ia']
    },
    billing: { plan: 'insight', includeIA: true },
    iaHooks: ['insight.problemSpotter', 'insight.forecastNarrative'],
    tokenBudget: 600
  },
  {
    key: 'automate',
    name: 'Direct Automate',
    description: 'Construtor de workflows, triggers, filas e regras de negócio.',
    prefix: '/automate',
    frontEnd: baseFrontend('workflows', ['gatilhos', 'logs']),
    backEnd: {
      services: ['WorkflowEngine', 'TriggerService', 'ActionService', 'IntegrationService', 'ExecutionLogService', 'RuleEngine'],
      collections: ['workflows', 'executions', 'triggers', 'logs'],
      commands: ['run-workflow', 'register-trigger', 'retry-failed', 'monitor-queue'],
      events: ['workflow.executed', 'trigger.fired', 'automation.failed', 'execution.retried'],
      integrations: ['all-modules']
    },
    billing: { plan: 'automate', includeIA: true },
    iaHooks: ['automate.flowSuggestion', 'automate.failureInsight'],
    tokenBudget: 650
  },
  {
    key: 'ai',
    name: 'Direct AI',
    description: 'Assistente contextual com RAG, FAISS e controle de tokens.',
    prefix: '/ai',
    frontEnd: baseFrontend('assistente', ['cards', 'resumos']),
    backEnd: {
      services: ['AiGateway', 'PromptOrchestrator', 'ContextBuilder', 'RetrievalService', 'EmbeddingsPipeline', 'TokenBudgetManager'],
      collections: ['aiSessions', 'embeddings', 'promptHistory', 'tokenLogs'],
      commands: ['query-assistant', 'summarize-context', 'generate-insight'],
      events: ['ia.query.started', 'ia.query.finished', 'ia.tokens.overage', 'ia.response.cached'],
      integrations: ['langchain', 'rag', 'faiss', 'automation']
    },
    billing: { plan: 'ai', includeIA: true, addon: 'ai-assistant' },
    iaHooks: ['ai.response', 'ai.nextSteps'],
    tokenBudget: 1500
  }
];
