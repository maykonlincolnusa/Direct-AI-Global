import { CanonicalEntity } from '../models/canonical';
import { ContextStorage } from '../storage/context-storage';
import { RetrievalService, type Citation, type RetrievalResult } from '../knowledge_base/retrieval-service';
import { IndustryAssessment } from '../industry/types';
import { ModelRouteDecision } from './model-router';

export type AgentDomain = 'sales' | 'finance' | 'operations' | 'strategy' | 'general';

export interface AgentPlan {
  domain: AgentDomain;
  responseMode: 'short' | 'standard';
  objectives: string[];
  industry?: string;
  workflow?: string;
  modelClass?: string;
}

export interface AgentAnswer {
  plan: AgentPlan;
  answer: string;
  citations: Citation[];
  confidence: 'low' | 'medium' | 'high';
  retrieval: RetrievalResult;
}

export class AgentOrchestrator {
  constructor(
    private readonly storage: ContextStorage,
    private readonly retrieval: RetrievalService
  ) {}

  async run(params: {
    tenantId: string;
    question: string;
    sessionSummary?: string;
    shortResponse?: boolean;
    industryAssessment?: IndustryAssessment;
    modelRoute?: ModelRouteDecision;
  }): Promise<AgentAnswer> {
    const plan = this.plan(
      params.question,
      Boolean(params.shortResponse),
      params.industryAssessment,
      params.modelRoute
    );
    const [entities, retrieval] = await Promise.all([
      this.storage.listCanonicalEntities(params.tenantId),
      this.retrieval.retrieve(params.tenantId, params.question, plan.responseMode === 'short' ? 4 : 6)
    ]);

    const draft = this.composeAnswer(
      plan,
      params.question,
      entities,
      retrieval.citations,
      params.sessionSummary,
      params.industryAssessment
    );
    const reviewed = this.criticReview(draft, retrieval.citations, plan.responseMode);

    return {
      plan,
      answer: reviewed.answer,
      citations: retrieval.citations,
      confidence: reviewed.confidence,
      retrieval
    };
  }

  private plan(
    question: string,
    shortResponse: boolean,
    industryAssessment?: IndustryAssessment,
    modelRoute?: ModelRouteDecision
  ): AgentPlan {
    const normalized = question.toLowerCase();

    if (includesAny(normalized, ['lead', 'pipeline', 'cliente', 'venda', 'forecast', 'proposta'])) {
      return {
        domain: 'sales',
        responseMode: shortResponse ? 'short' : 'standard',
        objectives: ['diagnosticar pipeline', 'priorizar conversao', 'apontar proxima acao'],
        industry: industryAssessment?.label,
        workflow: modelRoute?.workflow,
        modelClass: modelRoute?.modelClass
      };
    }

    if (includesAny(normalized, ['caixa', 'finance', 'pagamento', 'margem', 'receita', 'despesa'])) {
      return {
        domain: 'finance',
        responseMode: shortResponse ? 'short' : 'standard',
        objectives: ['avaliar saude financeira', 'reduzir risco', 'proteger margem'],
        industry: industryAssessment?.label,
        workflow: modelRoute?.workflow,
        modelClass: modelRoute?.modelClass
      };
    }

    if (includesAny(normalized, ['operacao', 'processo', 'erp', 'fila', 'capacidade', 'entrega'])) {
      return {
        domain: 'operations',
        responseMode: shortResponse ? 'short' : 'standard',
        objectives: ['mapear gargalos', 'alinhar capacidade', 'reduzir atrito operacional'],
        industry: industryAssessment?.label,
        workflow: modelRoute?.workflow,
        modelClass: modelRoute?.modelClass
      };
    }

    if (includesAny(normalized, ['estrategia', 'posicionamento', 'mercado', 'canal', 'crescimento'])) {
      return {
        domain: 'strategy',
        responseMode: shortResponse ? 'short' : 'standard',
        objectives: ['alinhar posicionamento', 'priorizar crescimento', 'reduzir inconsistencias'],
        industry: industryAssessment?.label,
        workflow: modelRoute?.workflow,
        modelClass: modelRoute?.modelClass
      };
    }

    return {
      domain: 'general',
      responseMode: shortResponse ? 'short' : 'standard',
      objectives: ['resumir contexto', 'encontrar evidencias', 'sugerir proximo passo'],
      industry: industryAssessment?.label,
      workflow: modelRoute?.workflow,
      modelClass: modelRoute?.modelClass
    };
  }

  private composeAnswer(
    plan: AgentPlan,
    question: string,
    entities: CanonicalEntity[],
    citations: Citation[],
    sessionSummary?: string,
    industryAssessment?: IndustryAssessment
  ) {
    const counts = countEntities(entities);
    const evidenceLine =
      citations[0]
        ? `Evidencia principal: ${citations[0].title} (${citations[0].source}).`
        : 'Nao ha evidencias suficientes indexadas para responder com alta confianca.';
    const sessionLine = sessionSummary ? `Contexto de sessao: ${sessionSummary.slice(0, 220)}.` : '';
    const industryLine = industryAssessment
      ? `Vertical dominante: ${industryAssessment.label} com readiness ${industryAssessment.readiness.overallScore}/100.`
      : '';
    const routingLine =
      plan.workflow || plan.modelClass
        ? `Rota aplicada: workflow ${plan.workflow ?? 'chat'} em perfil ${plan.modelClass ?? 'balanced'}.`
        : '';

    switch (plan.domain) {
      case 'sales':
        return [
          `Pergunta: ${question}.`,
          `Hoje o tenant possui ${counts.Lead ?? 0} leads, ${counts.Customer ?? 0} customers e ${counts.Order ?? 0} pedidos.`,
          'Leitura do agente comercial: verificar gargalos entre lead, proposta e pedido.',
          industryLine,
          routingLine,
          evidenceLine,
          sessionLine,
          'Proxima acao recomendada: revisar leads em proposta com baixo score e acelerar follow-up.'
        ]
          .filter(Boolean)
          .join(' ');
      case 'finance':
        return [
          `Pergunta: ${question}.`,
          `Hoje o tenant possui ${counts.Payment ?? 0} pagamentos e ${counts.FinancialRecord ?? 0} registros financeiros.`,
          'Leitura do agente financeiro: comparar volume de pagamentos, pedidos e pressao sobre margem.',
          industryLine,
          routingLine,
          evidenceLine,
          sessionLine,
          'Proxima acao recomendada: checar conciliacao, inadimplencia e thresholds de margem.'
        ]
          .filter(Boolean)
          .join(' ');
      case 'operations':
        return [
          `Pergunta: ${question}.`,
          `Hoje o tenant possui ${counts.OperationalEvent ?? 0} eventos operacionais e ${counts.Product ?? 0} produtos indexados.`,
          'Leitura do agente operacional: validar capacidade, gargalos de fila e promessas comerciais versus entrega.',
          industryLine,
          routingLine,
          evidenceLine,
          sessionLine,
          'Proxima acao recomendada: mapear eventos operacionais de severidade alta e alinhar SLA com o comercial.'
        ]
          .filter(Boolean)
          .join(' ');
      case 'strategy':
        return [
          `Pergunta: ${question}.`,
          `Hoje o tenant possui ${counts.WebsitePage ?? 0} paginas, ${counts.SocialPost ?? 0} posts sociais e ${counts.Campaign ?? 0} campanhas.`,
          'Leitura do agente estrategico: comparar narrativa comercial, posicionamento digital e sinais financeiros.',
          industryLine,
          routingLine,
          evidenceLine,
          sessionLine,
          'Proxima acao recomendada: alinhar promessa do site, canais e capacidade operacional.'
        ]
          .filter(Boolean)
          .join(' ');
      default:
        return [
          `Pergunta: ${question}.`,
          `Contexto indexado: ${entities.length} entidades distribuidas por vendas, financas, operacao e digital.`,
          industryLine,
          routingLine,
          evidenceLine,
          sessionLine,
          'Proxima acao recomendada: aprofundar a pergunta com recorte por modulo ou periodo.'
        ]
          .filter(Boolean)
          .join(' ');
    }
  }

  private criticReview(draft: string, citations: Citation[], responseMode: 'short' | 'standard') {
    if (citations.length === 0) {
      return {
        answer: `${draft} Resposta degradada: faltam chunks suficientes para grounding robusto.`,
        confidence: 'low' as const
      };
    }

    if (responseMode === 'short') {
      return {
        answer: draft.slice(0, 420),
        confidence: citations.length >= 3 ? 'high' as const : 'medium' as const
      };
    }

    return {
      answer: draft,
      confidence: citations.length >= 3 ? 'high' as const : 'medium' as const
    };
  }
}

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}

function countEntities(entities: CanonicalEntity[]) {
  const counts: Partial<Record<CanonicalEntity['entityType'], number>> = {};
  for (const entity of entities) {
    counts[entity.entityType] = (counts[entity.entityType] ?? 0) + 1;
  }
  return counts;
}
