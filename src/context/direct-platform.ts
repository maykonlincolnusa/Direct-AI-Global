import { AIContextEngine } from '../ai/ai-context-engine';
import { createConnector } from '../connectors/connector-factory';
import { SourceConnectorType } from '../connectors/types';
import { ContextIngestionPipeline } from '../ingestion/context-ingestion-pipeline';
import { TenantKnowledgeBase } from '../knowledge_base/in-memory-knowledge-base';
import { RetrievalService } from '../knowledge_base/retrieval-service';
import { BusinessDomain } from '../models/canonical';
import { IntegrationRegistry } from '../registry/integration-registry';
import { ContextStorage } from '../storage/context-storage';
import { ConsoleLogger } from '../utils/logger';

export class DirectPlatform {
  private readonly storage = new ContextStorage();
  private readonly registry = new IntegrationRegistry();
  private readonly knowledgeBase = new TenantKnowledgeBase();
  private readonly retrieval = new RetrievalService(this.knowledgeBase);
  private readonly ingestion = new ContextIngestionPipeline(
    this.storage,
    this.registry,
    this.knowledgeBase,
    new ConsoleLogger()
  );
  private readonly ai = new AIContextEngine(this.storage, this.knowledgeBase, this.registry);

  async registerConnector(tenantId: string, connectorType: SourceConnectorType, options: Record<string, unknown>) {
    const connectorId = String(options.connectorId ?? `${connectorType}-${tenantId}`);
    return this.registry.register({
      tenantId,
      connectorId,
      sourceType: connectorType,
      displayName: typeof options.displayName === 'string' ? options.displayName : undefined,
      priority: Number(options.priority ?? 5),
      syncMode:
        options.syncMode === 'scheduled' || options.syncMode === 'webhook' ? options.syncMode : 'manual',
      credentialsEnvKeys: Array.isArray(options.credentialsEnvKeys)
        ? (options.credentialsEnvKeys as string[])
        : [],
      capabilities: Array.isArray(options.capabilities) ? (options.capabilities as string[]) : [],
      domainCoverage: Array.isArray(options.domainCoverage)
        ? (options.domainCoverage as BusinessDomain[])
        : undefined
    });
  }

  async syncConnector(tenantId: string, connectorType: SourceConnectorType, options: Record<string, unknown>) {
    const connector = createConnector(connectorType, options);
    return this.ingestion.execute(tenantId, connector, String(options.cursor ?? ''));
  }

  async listConnectors(tenantId: string) {
    return this.registry.listByTenant(tenantId);
  }

  async getSummary(tenantId: string) {
    return this.ai.summarizeTenant(tenantId);
  }

  async getSuggestions(tenantId: string) {
    return this.ai.suggestActions(tenantId);
  }

  async getIndustryProfile(tenantId: string) {
    return this.ai.getIndustryProfile(tenantId);
  }

  async getDataReadiness(tenantId: string) {
    return this.ai.getDataReadiness(tenantId);
  }

  async getExecutionPlan(tenantId: string) {
    return this.ai.getExecutionPlan(tenantId);
  }

  async getUsageSummary(tenantId: string) {
    return this.ai.getUsageSummary(tenantId);
  }

  async ask(tenantId: string, question: string) {
    return this.ai.answerQuestion(tenantId, question);
  }

  async askWithContext(
    tenantId: string,
    question: string,
    options: {
      sessionId?: string;
      userId?: string;
      module?: string;
    }
  ) {
    return this.ai.answerQuestion(tenantId, question, options);
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
    return this.ai.recordFeedback(tenantId, input);
  }

  async getLearningSnapshot(tenantId: string) {
    return this.ai.getLearningSnapshot(tenantId);
  }

  async getKnowledgeStats(tenantId: string) {
    return this.knowledgeBase.getStats(tenantId);
  }

  async searchKnowledge(tenantId: string, query: string, topK = 6) {
    return this.retrieval.retrieve(tenantId, query, topK);
  }
}
