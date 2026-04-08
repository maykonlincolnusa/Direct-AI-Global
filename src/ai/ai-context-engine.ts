import { CanonicalEntity } from '../models/canonical';
import { TenantKnowledgeBase } from '../knowledge_base/in-memory-knowledge-base';
import { RetrievalService } from '../knowledge_base/retrieval-service';
import { ContextStorage } from '../storage/context-storage';
import { AgentOrchestrator } from './agent-orchestrator';
import { ConfidenceEngine } from './confidence-engine';
import { AIRuntimeManager } from './runtime-manager';
import { AIModelRouter } from './model-router';
import {
  EvaluationRunner,
  FeatureStore,
  FeedbackStore,
  ModelRegistry,
  TrainingDatasetBuilder
} from '../ml';
import { IntegrationRegistry } from '../registry/integration-registry';
import { IndustryIntelligence } from '../industry/industry-intelligence';
import { IndustryAssessment } from '../industry/types';
import { UsageBillingTracker } from '../billing/usage-billing';

export class AIContextEngine {
  private readonly retrieval: RetrievalService;
  private readonly runtime: AIRuntimeManager;
  private readonly orchestrator: AgentOrchestrator;
  private readonly feedbackStore: FeedbackStore;
  private readonly featureStore: FeatureStore;
  private readonly modelRegistry: ModelRegistry;
  private readonly datasetBuilder: TrainingDatasetBuilder;
  private readonly evaluationRunner: EvaluationRunner;
  private readonly industry: IndustryIntelligence;
  private readonly modelRouter: AIModelRouter;
  private readonly confidenceEngine: ConfidenceEngine;
  private readonly usageBilling: UsageBillingTracker;

  constructor(
    private readonly storage: ContextStorage,
    private readonly knowledgeBase: TenantKnowledgeBase,
    private readonly registry: IntegrationRegistry
  ) {
    this.retrieval = new RetrievalService(knowledgeBase);
    this.runtime = new AIRuntimeManager();
    this.orchestrator = new AgentOrchestrator(storage, this.retrieval);
    this.feedbackStore = new FeedbackStore();
    this.featureStore = new FeatureStore();
    this.modelRegistry = new ModelRegistry();
    this.datasetBuilder = new TrainingDatasetBuilder(this.feedbackStore);
    this.evaluationRunner = new EvaluationRunner(this.feedbackStore, this.datasetBuilder);
    this.industry = new IndustryIntelligence();
    this.modelRouter = new AIModelRouter();
    this.confidenceEngine = new ConfidenceEngine();
    this.usageBilling = new UsageBillingTracker(storage);
  }

  async summarizeTenant(tenantId: string) {
    const [entities, connectors] = await this.listTenantContext(tenantId);
    return this.buildTenantSummary(tenantId, entities, connectors);
  }

  async identifyOpportunities(tenantId: string) {
    const [entities, connectors] = await this.listTenantContext(tenantId);
    const industryAssessment = this.industry.assess(entities, connectors);
    const opportunities: string[] = [];
    const leadCount = countByType(entities, 'Lead');
    const orderCount = countByType(entities, 'Order');
    const paymentCount = countByType(entities, 'Payment');
    const socialCount = countByType(entities, 'SocialPost');

    if (leadCount > orderCount) {
      opportunities.push(
        'Pipeline comercial com mais leads do que pedidos. Priorizar conversao e follow-up automatico.'
      );
    }
    if (paymentCount < orderCount) {
      opportunities.push(
        'Numero de pagamentos menor que pedidos. Revisar cobranca, dunning e conciliacao financeira.'
      );
    }
    if (socialCount > 0 && leadCount === 0) {
      opportunities.push(
        'Atividade digital detectada sem captura de leads correspondente. Conectar campanhas com CRM.'
      );
    }
    if (industryAssessment.readiness.missingDomains.length > 0) {
      opportunities.push(
        `Dominios criticos ainda sem cobertura: ${industryAssessment.readiness.missingDomains.join(', ')}.`
      );
    }
    for (const action of this.industry.buildExecutionPlan(entities, connectors).priorities.slice(0, 2)) {
      opportunities.push(`${action.title}. ${action.why}`);
    }

    return opportunities;
  }

  async detectInconsistencies(tenantId: string) {
    const entities = await this.storage.listCanonicalEntities(tenantId);
    const issues: string[] = [];

    for (const payment of entities.filter((entity) => entity.entityType === 'Payment')) {
      const amount = Number(payment.attributes.amount ?? 0);
      if (amount <= 0) {
        issues.push(`Pagamento ${payment.id} possui valor invalido (${amount}).`);
      }
    }

    for (const lead of entities.filter((entity) => entity.entityType === 'Lead')) {
      const stage = String(lead.attributes.stage ?? '').toLowerCase();
      const score = Number(lead.attributes.score ?? 0);
      if (stage === 'proposal' && score < 20) {
        issues.push(`Lead ${lead.id} em proposta com score muito baixo (${score}).`);
      }
    }

    return issues;
  }

  async suggestActions(tenantId: string) {
    const [opportunities, inconsistencies, executionPlan] = await Promise.all([
      this.identifyOpportunities(tenantId),
      this.detectInconsistencies(tenantId),
      this.getExecutionPlan(tenantId)
    ]);

    return {
      commercial: opportunities.filter((entry) => entry.includes('Pipeline') || entry.includes('leads')),
      financial: opportunities.filter((entry) => entry.includes('pagamentos') || entry.includes('cobranca')),
      operational: inconsistencies,
      strategic: executionPlan.priorities.map((priority) => priority.title)
    };
  }

  async getIndustryProfile(tenantId: string) {
    const [entities, connectors] = await this.listTenantContext(tenantId);
    return this.industry.assess(entities, connectors);
  }

  async getDataReadiness(tenantId: string) {
    const profile = await this.getIndustryProfile(tenantId);
    return profile.readiness;
  }

  async getExecutionPlan(tenantId: string) {
    const [entities, connectors] = await this.listTenantContext(tenantId);
    return this.industry.buildExecutionPlan(entities, connectors);
  }

  async getUsageSummary(tenantId: string) {
    return this.usageBilling.summarizeTenant(tenantId);
  }

  async answerQuestion(
    tenantId: string,
    question: string,
    options: {
      sessionId?: string;
      userId?: string;
      module?: string;
    } = {}
  ) {
    const budget = await this.runtime.ensureBudget({
      tenantId,
      prompt: question,
      sessionId: options.sessionId,
      userId: options.userId,
      module: options.module ?? 'general'
    });

    const [sessionSummary, entities, connectors] = await Promise.all([
      this.runtime.summarizeSession(options.sessionId),
      this.storage.listCanonicalEntities(tenantId),
      this.registry.listByTenant(tenantId)
    ]);
    const industryAssessment = this.industry.assess(entities, connectors);
    const modelRoute = this.modelRouter.decide({
      question,
      module: options.module,
      industry: industryAssessment.primaryIndustry,
      readinessScore: industryAssessment.readiness.overallScore,
      shortResponse: budget.shortResponse
    });
    const cacheKey = this.runtime.buildCacheKey(
      {
        tenantId,
        prompt: question,
        sessionId: options.sessionId,
        userId: options.userId,
        module: options.module
      },
      sessionSummary
    );
    const cached = await this.runtime.getCachedAnswer(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        budget
      };
    }

    await this.runtime.rememberTurn(options.sessionId, 'user', question);
    const agentResponse = await this.orchestrator.run({
      tenantId,
      question,
      sessionSummary,
      shortResponse: budget.shortResponse,
      industryAssessment,
      modelRoute
    });
    const confidenceReport = this.confidenceEngine.evaluate({
      retrieval: agentResponse.retrieval,
      readinessScore: industryAssessment.readiness.overallScore,
      entityCount: entities.length
    });
    const usage = await this.usageBilling.trackAnswer({
      tenantId,
      userId: options.userId,
      module: options.module ?? 'general',
      workflow: modelRoute.workflow,
      model: `${modelRoute.providerHint}:${modelRoute.modelClass}`,
      prompt: question,
      contextText: agentResponse.retrieval.contextText,
      answer: agentResponse.answer,
      cached: false
    });

    const summary = await this.buildTenantSummary(tenantId, entities, connectors);
    const response = {
      question,
      tenantId,
      answer: agentResponse.answer,
      plan: agentResponse.plan,
      confidence: agentResponse.confidence,
      confidenceScore: confidenceReport.score,
      confidenceReport,
      evidence: agentResponse.citations,
      retrieval: agentResponse.retrieval.diagnostics,
      modelRoute,
      industryProfile: {
        primaryIndustry: industryAssessment.primaryIndustry,
        label: industryAssessment.label,
        readinessScore: industryAssessment.readiness.overallScore
      },
      usage,
      summary,
      cached: false,
      budget
    };

    await this.runtime.rememberTurn(options.sessionId, 'assistant', response.answer);
    await this.runtime.cacheAnswer(cacheKey, response);
    return response;
  }

  async recordFeedback(
    tenantId: string,
    input: {
      question: string;
      answer: string;
      helpful: boolean;
      notes?: string;
    }
  ) {
    return this.feedbackStore.record(tenantId, input);
  }

  async getLearningSnapshot(tenantId: string) {
    const entities = await this.storage.listCanonicalEntities(tenantId);
    const [models, evaluation, dataset] = await Promise.all([
      this.modelRegistry.list(),
      this.evaluationRunner.run(tenantId),
      this.datasetBuilder.buildForTenant(tenantId)
    ]);

    return {
      tenantId,
      features: this.featureStore.buildSnapshot(tenantId, entities),
      models,
      evaluation,
      trainingDataset: {
        size: dataset.length,
        preview: dataset.slice(0, 5)
      }
    };
  }

  private async listTenantContext(tenantId: string) {
    const [entities, connectors] = await Promise.all([
      this.storage.listCanonicalEntities(tenantId),
      this.registry.listByTenant(tenantId)
    ]);
    return [entities, connectors] as const;
  }

  private async buildTenantSummary(
    tenantId: string,
    entities: CanonicalEntity[],
    connectors: Awaited<ReturnType<IntegrationRegistry['listByTenant']>>
  ) {
    const grouped = groupByType(entities);
    const latestVersion = await this.storage.getLatestContextVersion(tenantId);
    const industryProfile = this.industry.assess(entities, connectors);
    const connectorSummary = await this.registry.summarizeByTenant(tenantId);

    return {
      tenantId,
      latestVersion: latestVersion ?? 'not-generated',
      totalEntities: entities.length,
      entitiesByType: grouped,
      industryProfile,
      connectors: connectorSummary,
      readiness: industryProfile.readiness,
      businessMetrics: industryProfile.businessMetrics,
      overview: this.buildOverview(grouped, industryProfile)
    };
  }

  private buildOverview(grouped: Record<string, number>, industryProfile: IndustryAssessment) {
    const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    const primaryFocus = entries[0]?.[0] ?? 'none';
    const gaps = ['Lead', 'Payment', 'OperationalEvent', 'WebsitePage']
      .filter((type) => !grouped[type])
      .map((type) => `${type} sem dados`);

    return {
      primaryFocus,
      gaps,
      industry: industryProfile.label,
      readinessScore: industryProfile.readiness.overallScore,
      topSignal: industryProfile.signals[0] ?? 'No dominant business signal yet.'
    };
  }
}

function groupByType(entities: CanonicalEntity[]) {
  const grouped: Record<string, number> = {};
  for (const entity of entities) {
    grouped[entity.entityType] = (grouped[entity.entityType] ?? 0) + 1;
  }
  return grouped;
}

function countByType(entities: CanonicalEntity[], type: CanonicalEntity['entityType']) {
  return entities.filter((entity) => entity.entityType === type).length;
}
