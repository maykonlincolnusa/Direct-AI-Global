import { estimateTokens } from '../utils/text';
import { ContextStorage } from '../storage/context-storage';

export interface UsageChargeRecord {
  tenantId: string;
  userId?: string;
  module: string;
  workflow: string;
  model: string;
  promptTokens: number;
  contextTokens: number;
  answerTokens: number;
  totalTokens: number;
  estimatedCost: number;
  cached: boolean;
  at: string;
}

export class UsageBillingTracker {
  constructor(private readonly storage: ContextStorage) {}

  async trackAnswer(input: {
    tenantId: string;
    userId?: string;
    module: string;
    workflow: string;
    model: string;
    prompt: string;
    contextText: string;
    answer: string;
    cached: boolean;
  }) {
    const promptTokens = estimateTokens(input.prompt);
    const contextTokens = estimateTokens(input.contextText);
    const answerTokens = estimateTokens(input.answer);
    const totalTokens = promptTokens + contextTokens + answerTokens;
    const estimatedCost = estimateModelCost(input.model, totalTokens);

    const record: UsageChargeRecord = {
      tenantId: input.tenantId,
      userId: input.userId,
      module: input.module,
      workflow: input.workflow,
      model: input.model,
      promptTokens,
      contextTokens,
      answerTokens,
      totalTokens,
      estimatedCost,
      cached: input.cached,
      at: new Date().toISOString()
    };

    await this.storage.appendUsageLog(input.tenantId, record);
    return record;
  }

  async summarizeTenant(tenantId: string) {
    const records = await this.storage.listUsageLogs(tenantId);
    const totalTokens = records.reduce((sum, record) => sum + record.totalTokens, 0);
    const totalCost = Number(records.reduce((sum, record) => sum + record.estimatedCost, 0).toFixed(6));
    const byModule = records.reduce<Record<string, { tokens: number; cost: number; requests: number }>>(
      (acc, record) => {
        const current = acc[record.module] ?? { tokens: 0, cost: 0, requests: 0 };
        current.tokens += record.totalTokens;
        current.cost = Number((current.cost + record.estimatedCost).toFixed(6));
        current.requests += 1;
        acc[record.module] = current;
        return acc;
      },
      {}
    );

    return {
      tenantId,
      totalTokens,
      totalCost,
      requests: records.length,
      modules: byModule,
      recent: records.slice(-10).reverse()
    };
  }
}

function estimateModelCost(model: string, totalTokens: number) {
  const pricePer1KTokens = model.includes('reasoning')
    ? 0.012
    : model.includes('economy')
      ? 0.0015
      : 0.005;

  return Number(((totalTokens / 1000) * pricePer1KTokens).toFixed(6));
}
