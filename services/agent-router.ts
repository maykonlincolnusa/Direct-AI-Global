import {
  createOpenRouterLlmService,
  type CompletionOptions,
  type LlmMessage
} from "./llm.service.js";

export type TaskType = "sales" | "data" | "automation" | "decision";

const TASK_PROMPTS: Record<TaskType, string> = {
  sales:
    "You are a senior sales copilot. Focus on pipeline, lead quality, objections, follow-up and commercial next steps.",
  data:
    "You are a senior data analyst. Focus on metrics, reports, anomalies, data quality and executive summaries.",
  automation:
    "You are a senior automation architect. Focus on workflows, triggers, retries, orchestration and operational scale.",
  decision:
    "You are a senior business strategist. Focus on trade-offs, risks, prioritization and clear recommendations."
};

export function detectTask(input: string): TaskType {
  const normalized = input.toLowerCase();

  if (
    includesAny(normalized, [
      "lead",
      "sale",
      "sales",
      "pipeline",
      "cliente",
      "venda",
      "comercial",
      "forecast",
      "proposta"
    ])
  ) {
    return "sales";
  }

  if (
    includesAny(normalized, [
      "data",
      "report",
      "dashboard",
      "kpi",
      "relatorio",
      "métrica",
      "metrica",
      "indicador",
      "analise",
      "análise"
    ])
  ) {
    return "data";
  }

  if (
    includesAny(normalized, [
      "automation",
      "workflow",
      "trigger",
      "queue",
      "automação",
      "automacao",
      "fluxo",
      "integração",
      "integracao"
    ])
  ) {
    return "automation";
  }

  return "decision";
}

export function buildTaskMessages(
  input: string,
  history: LlmMessage[] = [],
  forcedTask?: TaskType
): { task: TaskType; messages: LlmMessage[] } {
  const task = forcedTask ?? detectTask(input);

  return {
    task,
    messages: [
      {
        role: "system",
        content: TASK_PROMPTS[task]
      },
      ...history,
      {
        role: "user",
        content: input
      }
    ]
  };
}

export async function routeAgentCompletion(
  input: string,
  history: LlmMessage[] = [],
  options?: CompletionOptions & { task?: TaskType }
) {
  const llm = createOpenRouterLlmService();
  const routed = buildTaskMessages(input, history, options?.task);
  const completion = await llm.complete(routed.messages, options);

  return {
    task: routed.task,
    model: completion.model,
    message: completion.message,
    usage: completion.usage
  };
}

export async function routeAgentWithReasoningContinuation(
  input: string,
  followUpPrompt: string,
  history: LlmMessage[] = [],
  options?: CompletionOptions & { task?: TaskType }
) {
  const llm = createOpenRouterLlmService();
  const routed = buildTaskMessages(input, history, options?.task);
  const continued = await llm.continueReasoning(
    routed.messages,
    followUpPrompt,
    options
  );

  return {
    task: routed.task,
    firstPass: continued.firstPass,
    secondPass: continued.secondPass,
    messages: continued.chainedMessages
  };
}

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}
