import { RetrievalResult } from '../knowledge_base/retrieval-service';

export interface ConfidenceReport {
  label: 'low' | 'medium' | 'high';
  score: number;
  factors: {
    readiness: number;
    grounding: number;
    coverage: number;
  };
  explanation: string[];
}

export class ConfidenceEngine {
  evaluate(input: {
    retrieval: RetrievalResult;
    readinessScore: number;
    entityCount: number;
  }): ConfidenceReport {
    const readiness = clamp01(input.readinessScore / 100);
    const grounding = clamp01(input.retrieval.diagnostics.averageScore);
    const coverage = clamp01(
      Math.min(1, input.retrieval.diagnostics.citationCount / 4) * 0.7 +
        Math.min(1, input.entityCount / 20) * 0.3
    );
    const score = Number((readiness * 0.35 + grounding * 0.45 + coverage * 0.2).toFixed(2));

    const explanation = [
      `Readiness contribution: ${Math.round(readiness * 100)}%.`,
      `Grounding contribution: ${Math.round(grounding * 100)}% from reranked evidence.`,
      `Coverage contribution: ${Math.round(coverage * 100)}% based on citations and indexed entities.`
    ];

    return {
      label: score >= 0.75 ? 'high' : score >= 0.5 ? 'medium' : 'low',
      score,
      factors: {
        readiness: Number(readiness.toFixed(2)),
        grounding: Number(grounding.toFixed(2)),
        coverage: Number(coverage.toFixed(2))
      },
      explanation
    };
  }
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
