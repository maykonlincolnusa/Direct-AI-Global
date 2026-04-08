import { FeedbackStore } from './feedback-store';

export interface TrainingExample {
  tenantId: string;
  input: string;
  expectedStyle: 'keep' | 'revise';
  notes?: string;
}

export class TrainingDatasetBuilder {
  constructor(private readonly feedbackStore: FeedbackStore) {}

  async buildForTenant(tenantId: string) {
    const feedback = await this.feedbackStore.listByTenant(tenantId);
    return feedback.map<TrainingExample>((entry) => ({
      tenantId,
      input: entry.question,
      expectedStyle: entry.helpful ? 'keep' : 'revise',
      notes: entry.notes
    }));
  }
}
