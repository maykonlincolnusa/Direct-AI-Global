import { IndustryType } from '../models/canonical';

export type AIWorkflowType =
  | 'classification'
  | 'extraction'
  | 'retrieval'
  | 'diagnosis'
  | 'planning'
  | 'automation'
  | 'chat';

export interface ModelRouteDecision {
  workflow: AIWorkflowType;
  modelClass: 'economy' | 'balanced' | 'reasoning';
  providerHint: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'self_hosted';
  reasoningLevel: 'low' | 'medium' | 'high';
  responseMode: 'short' | 'standard';
  maxContextTokens: number;
  useRag: boolean;
  useReranking: boolean;
  cacheable: boolean;
  fallbackChain: string[];
  rationale: string[];
}

export class AIModelRouter {
  decide(input: {
    question: string;
    module?: string;
    industry?: IndustryType;
    readinessScore?: number;
    shortResponse?: boolean;
  }): ModelRouteDecision {
    const normalized = input.question.toLowerCase();
    const workflow = inferWorkflow(normalized, input.module);
    const responseMode = input.shortResponse ? 'short' : 'standard';
    const rationale: string[] = [];

    let modelClass: ModelRouteDecision['modelClass'] = 'balanced';
    let reasoningLevel: ModelRouteDecision['reasoningLevel'] = 'medium';
    let providerHint: ModelRouteDecision['providerHint'] = 'openrouter';
    let maxContextTokens = 12_000;
    let useRag = true;
    let useReranking = true;
    let cacheable = workflow !== 'automation';

    if (workflow === 'classification' || workflow === 'extraction') {
      modelClass = 'economy';
      reasoningLevel = 'low';
      maxContextTokens = 6_000;
      rationale.push('Low-complexity task routed to cheaper model profile.');
    }

    if (workflow === 'planning' || workflow === 'diagnosis') {
      modelClass = 'reasoning';
      reasoningLevel = 'high';
      maxContextTokens = 18_000;
      rationale.push('Cross-domain reasoning requested, so the route prefers a deeper model.');
    }

    if (workflow === 'automation') {
      modelClass = 'balanced';
      reasoningLevel = 'medium';
      useRag = false;
      useReranking = false;
      cacheable = false;
      rationale.push('Automation route favors deterministic action plans over long grounded chat.');
    }

    if ((input.readinessScore ?? 0) < 45) {
      maxContextTokens = Math.min(maxContextTokens, 8_000);
      rationale.push('Low readiness score detected, so context window is constrained to reduce hallucination risk.');
    }

    if (input.industry === 'healthcare' || input.industry === 'manufacturing_b2b') {
      providerHint = 'openai';
      rationale.push('Higher-risk industry detected; route favors stronger instruction-following baseline.');
    }

    if (input.industry === 'retail_ecommerce' && workflow === 'classification') {
      providerHint = 'google';
      rationale.push('Retail classification tasks can run on lower-cost fast models.');
    }

    if (responseMode === 'short') {
      maxContextTokens = Math.min(maxContextTokens, 9_000);
      rationale.push('Short response mode enabled to reduce token consumption.');
    }

    return {
      workflow,
      modelClass,
      providerHint,
      reasoningLevel,
      responseMode,
      maxContextTokens,
      useRag,
      useReranking,
      cacheable,
      fallbackChain: buildFallbackChain(modelClass, providerHint),
      rationale
    };
  }
}

function inferWorkflow(question: string, module?: string): AIWorkflowType {
  if (includesAny(question, ['classify', 'categorize', 'tag', 'classificar', 'categorizar'])) {
    return 'classification';
  }

  if (includesAny(question, ['extract', 'parse', 'entity', 'ocr', 'extrair'])) {
    return 'extraction';
  }

  if (includesAny(question, ['why', 'diagnose', 'gargalo', 'root cause', 'diagnosticar', 'inconsistencia'])) {
    return 'diagnosis';
  }

  if (includesAny(question, ['next action', 'plano', 'plan', 'prioritize', 'priorizar', 'roadmap'])) {
    return 'planning';
  }

  if (includesAny(question, ['workflow', 'automate', 'automation', 'trigger', 'automa'])) {
    return 'automation';
  }

  if (module === 'knowledge' || includesAny(question, ['search', 'retrieve', 'buscar', 'evidence', 'evidencia'])) {
    return 'retrieval';
  }

  return 'chat';
}

function buildFallbackChain(
  modelClass: ModelRouteDecision['modelClass'],
  providerHint: ModelRouteDecision['providerHint']
) {
  const chain = [`${providerHint}:${modelClass}`];

  if (modelClass === 'reasoning') {
    chain.push('openrouter:balanced', 'self_hosted:economy');
  } else if (modelClass === 'balanced') {
    chain.push('openrouter:economy', 'self_hosted:economy');
  } else {
    chain.push('self_hosted:economy');
  }

  return chain;
}

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}
