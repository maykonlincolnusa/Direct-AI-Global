import { FeedbackStore } from './feedback-store';
import { TrainingDatasetBuilder } from './training-dataset';

export interface EvaluationSummary {
  tenantId: string;
  generatedAt: string;
  feedbackCount: number;
  positiveRate: number;
  datasetSize: number;
  recommendation: string;
}

export class EvaluationRunner {
  constructor(
    private readonly feedbackStore: FeedbackStore,
    private readonly datasetBuilder: TrainingDatasetBuilder
  ) {}

  async run(tenantId: string): Promise<EvaluationSummary> {
    const [feedback, dataset] = await Promise.all([
      this.feedbackStore.listByTenant(tenantId),
      this.datasetBuilder.buildForTenant(tenantId)
    ]);

    const positives = feedback.filter((entry) => entry.helpful).length;
    const positiveRate = feedback.length === 0 ? 0 : Number((positives / feedback.length).toFixed(4));

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      feedbackCount: feedback.length,
      positiveRate,
      datasetSize: dataset.length,
      recommendation:
        positiveRate < 0.65
          ? 'Revisar retrieval, grounding e politica de resposta curta.'
          : 'Continuar coletando feedback e expandir dataset supervisionado.'
    };
  }
}
