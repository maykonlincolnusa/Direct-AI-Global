import { http } from "./http";

const DEFAULT_TENANT_ID = import.meta.env.VITE_DIRECT_TENANT_ID ?? "tenant-demo";

export type ViewKey = "painel" | "integracoes" | "copiloto" | "configuracoes";
export type ConnectorStatus = "healthy" | "syncing" | "warning" | "disconnected";
export type MetricTone = "orange" | "teal" | "blue" | "gold" | "violet";

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: MetricTone;
};

export type DashboardActivity = {
  id: string;
  type: string;
  detail: string;
  time: string;
};

export type RuntimeConnector = {
  id: string;
  sourceType: string;
  name: string;
  category: string;
  status: ConnectorStatus;
  description: string;
  connected: boolean;
  priority: number;
  syncMode?: string;
  credentialsHint?: string;
  coverage: string[];
  reason?: string;
};

export type ConnectorRecommendation = {
  connectorType: string;
  domain: string;
  priority: "high" | "medium" | "low";
  reason: string;
};

type RuntimeConnectorResponse = {
  id: string;
  sourceType: string;
  priority?: number;
  syncMode?: string;
  credentialsStatus?: string;
  healthCheck?: {
    state?: string;
  };
};

export type ExecutionPriority = {
  title: string;
  why: string;
  impact: "revenue" | "efficiency" | "risk" | "retention";
  horizon: "now" | "next" | "later";
};

export type ReadinessReport = {
  overallScore: number;
  freshnessScore: number;
  sourceBreadth: number;
  missingDomains: string[];
  confidence: "low" | "medium" | "high";
  domainCoverage: Record<
    string,
    {
      present: boolean;
      entityCount: number;
      connectorCount: number;
      score: number;
    }
  >;
};

export type IndustryProfile = {
  primaryIndustry: string;
  label: string;
  description: string;
  confidence: "low" | "medium" | "high";
  signals: string[];
  kpis: Array<{
    key: string;
    label: string;
    domain: string;
    description: string;
  }>;
  businessMetrics: Array<{
    key: string;
    label: string;
    value: number;
    unit: "count" | "currency" | "ratio";
    narrative: string;
  }>;
  recommendedConnectors: ConnectorRecommendation[];
  readiness: ReadinessReport;
};

export type DashboardSummary = {
  tenantId: string;
  latestVersion: string;
  totalEntities: number;
  entitiesByType: Record<string, number>;
  businessMetrics: IndustryProfile["businessMetrics"];
  overview: {
    primaryFocus: string;
    gaps: string[];
    industry: string;
    readinessScore: number;
    topSignal: string;
  };
};

export type UsageSummary = {
  tenantId: string;
  totalTokens: number;
  totalCost: number;
  requests: number;
  modules: Record<string, { tokens: number; cost: number; requests: number }>;
  recent: Array<{
    module: string;
    workflow: string;
    model: string;
    totalTokens: number;
    estimatedCost: number;
    at: string;
  }>;
};

export type CopilotResponse = {
  answer: string;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  confidenceReport: {
    factors: {
      readiness: number;
      grounding: number;
      coverage: number;
    };
    explanation: string[];
  };
  industryProfile: {
    label: string;
    readinessScore: number;
  };
  modelRoute: {
    workflow: string;
    modelClass: string;
    providerHint: string;
    responseMode: string;
  };
  usage: {
    model: string;
    totalTokens: number;
    estimatedCost: number;
  };
  evidence: Array<{
    title: string;
    source: string;
    score: number;
  }>;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  revenueSeries: Array<{ month: string; receita: number; despesas: number }>;
  recentActivity: DashboardActivity[];
  industryProfile: IndustryProfile;
  readiness: ReadinessReport;
  executionPlan: {
    primaryIndustry: string;
    readinessScore: number;
    priorities: ExecutionPriority[];
    connectorRecommendations: ConnectorRecommendation[];
  };
  integrations: RuntimeConnector[];
  recommendations: ConnectorRecommendation[];
  usage: UsageSummary;
  summary: DashboardSummary;
};

type IntegrationDefinition = {
  sourceType: string;
  name: string;
  category: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
  }>;
  credentialsEnvKeys: string[];
  capabilities: string[];
  domainCoverage: string[];
};

export const views: Array<{
  id: ViewKey;
  labelKey: string;
  eyebrowKey: string;
  path: string;
}> = [
  { id: "painel", labelKey: "views.painel.label", eyebrowKey: "views.painel.eyebrow", path: "/" },
  { id: "integracoes", labelKey: "views.integracoes.label", eyebrowKey: "views.integracoes.eyebrow", path: "/integracoes" },
  { id: "copiloto", labelKey: "views.copiloto.label", eyebrowKey: "views.copiloto.eyebrow", path: "/copiloto" },
  { id: "configuracoes", labelKey: "views.configuracoes.label", eyebrowKey: "views.configuracoes.eyebrow", path: "/configuracoes" }
];

export const integrationCategories = [
  { id: "all", label: "Todas" },
  { id: "social", label: "Social" },
  { id: "digital", label: "Digital" },
  { id: "business", label: "Business" },
  { id: "knowledge", label: "Knowledge" }
];

export const supportedIntegrations: IntegrationDefinition[] = [
  {
    sourceType: "website_reader",
    name: "Website Reader",
    category: "digital",
    description: "Lê sitemap, páginas, títulos, CTAs, SEO e posicionamento do site.",
    fields: [{ key: "baseUrl", label: "Base URL", placeholder: "https://company.com" }],
    credentialsEnvKeys: [],
    capabilities: ["pages", "seo", "positioning"],
    domainCoverage: ["digital", "knowledge"]
  },
  {
    sourceType: "google_business_profile",
    name: "Google Business Profile",
    category: "digital",
    description: "Sincroniza locais, reputação, horário, telefone e reviews.",
    fields: [
      { key: "accountName", label: "Account name", placeholder: "accounts/123456789" },
      { key: "locationId", label: "Location ID", placeholder: "987654321" }
    ],
    credentialsEnvKeys: ["GOOGLE_BUSINESS_ACCESS_TOKEN"],
    capabilities: ["locations", "reviews", "local-presence"],
    domainCoverage: ["digital", "customer"]
  },
  {
    sourceType: "crm",
    name: "HubSpot CRM",
    category: "business",
    description: "Importa contatos e deals reais para pipeline e customer context.",
    fields: [{ key: "limit", label: "Sync limit", placeholder: "50" }],
    credentialsEnvKeys: ["HUBSPOT_ACCESS_TOKEN"],
    capabilities: ["contacts", "deals", "pipeline"],
    domainCoverage: ["sales", "customer"]
  },
  {
    sourceType: "financial",
    name: "Stripe Finance",
    category: "business",
    description: "Lê Payment Intents e balance transactions para receita e fluxo financeiro.",
    fields: [{ key: "limit", label: "Sync limit", placeholder: "50" }],
    credentialsEnvKeys: ["STRIPE_SECRET_KEY"],
    capabilities: ["payments", "cashflow", "balance"],
    domainCoverage: ["finance"]
  },
  {
    sourceType: "erp",
    name: "ERP REST",
    category: "business",
    description: "Conector ERP via endpoint REST para produtos, pedidos e eventos operacionais.",
    fields: [{ key: "baseUrl", label: "ERP API URL", placeholder: "https://erp.example.com/api" }],
    credentialsEnvKeys: ["ERP_ACCESS_TOKEN"],
    capabilities: ["products", "orders", "operations"],
    domainCoverage: ["operations", "sales"]
  },
  {
    sourceType: "social",
    name: "Social Feed",
    category: "social",
    description: "Ingere feed RSS/Atom para capturar posts e sinais editoriais reais.",
    fields: [
      { key: "feedUrl", label: "Feed URL", placeholder: "https://company.com/feed.xml" },
      { key: "network", label: "Network label", placeholder: "linkedin" }
    ],
    credentialsEnvKeys: [],
    capabilities: ["posts", "content-signals"],
    domainCoverage: ["digital"]
  },
  {
    sourceType: "manual_upload",
    name: "Manual Upload",
    category: "knowledge",
    description: "Indexa PDFs, planilhas e documentos como base de conhecimento por tenant.",
    fields: [{ key: "filePaths", label: "File paths", placeholder: "C:\\docs\\one.pdf,C:\\docs\\two.csv" }],
    credentialsEnvKeys: [],
    capabilities: ["documents", "files", "knowledge"],
    domainCoverage: ["knowledge"]
  }
];

export const copilotSuggestions = [
  "Quais lacunas de contexto mais prejudicam o meu crescimento?",
  "Qual a proxima melhor acao para aumentar receita com menor risco?",
  "Onde a operacao esta desalinhada com a promessa comercial?"
];

export async function fetchDashboard() {
  const [summary, industryProfile, readiness, executionPlan, connectors, recommendations, usage] =
    await Promise.all([
      safeGet<DashboardSummary>(`/tenants/${DEFAULT_TENANT_ID}/context/summary`),
      safeGet<IndustryProfile>(`/tenants/${DEFAULT_TENANT_ID}/context/industry`),
      safeGet<ReadinessReport>(`/tenants/${DEFAULT_TENANT_ID}/context/readiness`),
      safeGet<DashboardData["executionPlan"]>(`/tenants/${DEFAULT_TENANT_ID}/context/execution-plan`),
      safeGet<RuntimeConnectorResponse[]>(`/tenants/${DEFAULT_TENANT_ID}/connectors`),
      safeGet<ConnectorRecommendation[]>(`/tenants/${DEFAULT_TENANT_ID}/connectors/recommendations`),
      safeGet<UsageSummary>(`/tenants/${DEFAULT_TENANT_ID}/context/usage`)
    ]);

  const mergedIntegrations = mergeIntegrations(connectors ?? [], recommendations ?? []);
  const resolvedSummary = summary ?? createFallbackSummary();
  const resolvedIndustry = industryProfile ?? createFallbackIndustry();
  const resolvedReadiness = readiness ?? resolvedIndustry.readiness;
  const resolvedPlan = executionPlan ?? createFallbackExecutionPlan(resolvedIndustry);
  const resolvedUsage = usage ?? createFallbackUsage();

  return {
    metrics: buildMetrics(resolvedSummary, resolvedReadiness, mergedIntegrations, resolvedUsage),
    revenueSeries: buildRevenueSeries(resolvedSummary, resolvedUsage),
    recentActivity: buildRecentActivity(resolvedPlan, mergedIntegrations, resolvedUsage),
    industryProfile: resolvedIndustry,
    readiness: resolvedReadiness,
    executionPlan: resolvedPlan,
    integrations: mergedIntegrations,
    recommendations: recommendations ?? [],
    usage: resolvedUsage,
    summary: resolvedSummary
  } satisfies DashboardData;
}

export async function askCopilot(question: string, sessionId: string) {
  const response = await http.post<CopilotResponse>(
    `/tenants/${DEFAULT_TENANT_ID}/context/ask`,
    {
      question,
      sessionId,
      module: "copilot",
      userId: "console-user"
    }
  );
  return response.data;
}

export async function connectIntegration(
  sourceType: string,
  rawPayload: Record<string, string>
) {
  const definition = supportedIntegrations.find((item) => item.sourceType === sourceType);
  if (!definition) {
    throw new Error(`Unsupported integration: ${sourceType}`);
  }

  const syncPayload = normalizeSyncPayload(sourceType, rawPayload);
  const connectorId = `${sourceType}-${DEFAULT_TENANT_ID}`;

  await http.post(`/tenants/${DEFAULT_TENANT_ID}/connectors/register`, {
    connectorType: sourceType,
    connectorId,
    displayName: definition.name,
    capabilities: definition.capabilities,
    domainCoverage: definition.domainCoverage,
    credentialsEnvKeys: definition.credentialsEnvKeys,
    syncMode: "manual"
  });

  const syncResponse = await http.post(`/tenants/${DEFAULT_TENANT_ID}/sync/${sourceType}`, {
    connectorId,
    ...syncPayload
  });

  return syncResponse.data;
}

export function toneFromStatus(status: ConnectorStatus) {
  if (status === "healthy") return "teal";
  if (status === "syncing") return "blue";
  if (status === "disconnected") return "violet";
  return "gold";
}

export function viewFromPath(pathname: string): ViewKey {
  return views.find((v) => v.path === pathname)?.id ?? "painel";
}

function mergeIntegrations(
  connectors: RuntimeConnectorResponse[],
  recommendations: ConnectorRecommendation[]
) {
  return supportedIntegrations.map((definition) => {
    const runtime = connectors.find((item) => item.sourceType === definition.sourceType);
    const recommendation = recommendations.find((item) => item.connectorType === definition.sourceType);
    const healthState = runtime?.healthCheck?.state ?? "";
    const credentialsStatus = runtime?.credentialsStatus ?? "";
    const status = mapConnectorStatus(Boolean(runtime), healthState, credentialsStatus);

    return {
      id: definition.sourceType,
      sourceType: definition.sourceType,
      name: definition.name,
      category: definition.category,
      status,
      description: definition.description,
      connected: Boolean(runtime),
      priority: Number(runtime?.priority ?? recommendationPriorityWeight(recommendation?.priority) ?? 5),
      syncMode: runtime?.syncMode,
      credentialsHint:
        definition.credentialsEnvKeys.length > 0
          ? `Env: ${definition.credentialsEnvKeys.join(", ")}`
          : "No secret required",
      coverage: definition.domainCoverage,
      reason: recommendation?.reason
    } satisfies RuntimeConnector;
  });
}

function mapConnectorStatus(connected: boolean, healthState: string, credentialsStatus: string): ConnectorStatus {
  if (!connected) return "disconnected";
  if (healthState === "ok" && credentialsStatus !== "missing") return "healthy";
  if (healthState === "unknown") return "syncing";
  return "warning";
}

function recommendationPriorityWeight(priority: string | undefined) {
  if (priority === "high") return 9;
  if (priority === "medium") return 6;
  return 4;
}

function buildMetrics(
  summary: DashboardSummary,
  readiness: ReadinessReport,
  integrations: RuntimeConnector[],
  usage: UsageSummary
) {
  const revenueMetric = summary.businessMetrics.find((metric) => metric.key === "revenue_signal");

  return [
    {
      label: "Readiness",
      value: `${readiness.overallScore}/100`,
      delta: `${readiness.sourceBreadth} fontes com grounding`,
      tone: "teal"
    },
    {
      label: "Entities",
      value: Intl.NumberFormat("en-US").format(summary.totalEntities),
      delta: `${summary.overview.primaryFocus} domina o contexto`,
      tone: "orange"
    },
    {
      label: "Connected sources",
      value: String(integrations.filter((item) => item.connected).length),
      delta: `${integrations.filter((item) => item.status === "healthy").length} saudaveis`,
      tone: "blue"
    },
    {
      label: "AI usage",
      value: `$${usage.totalCost.toFixed(2)}`,
      delta: `${Intl.NumberFormat("en-US").format(usage.totalTokens)} tokens`,
      tone: revenueMetric && revenueMetric.value > 0 ? "gold" : "violet"
    }
  ] satisfies DashboardMetric[];
}

function buildRevenueSeries(summary: DashboardSummary, usage: UsageSummary) {
  const revenueValue = summary.businessMetrics.find((metric) => metric.key === "revenue_signal")?.value ?? 0;
  const usageCost = Math.max(usage.totalCost, 1);
  const revenueBase = Number(revenueValue || 0);

  return [
    { month: "Jan", receita: revenueBase * 0.62, despesas: usageCost * 20 },
    { month: "Feb", receita: revenueBase * 0.7, despesas: usageCost * 24 },
    { month: "Mar", receita: revenueBase * 0.78, despesas: usageCost * 28 },
    { month: "Apr", receita: revenueBase * 0.85, despesas: usageCost * 31 },
    { month: "May", receita: revenueBase * 0.93, despesas: usageCost * 36 },
    { month: "Jun", receita: revenueBase || 1, despesas: usageCost * 40 }
  ].map((row) => ({
    month: row.month,
    receita: Number(row.receita.toFixed(2)),
    despesas: Number(row.despesas.toFixed(2))
  }));
}

function buildRecentActivity(
  executionPlan: DashboardData["executionPlan"],
  integrations: RuntimeConnector[],
  usage: UsageSummary
) {
  const activities: DashboardActivity[] = executionPlan.priorities.slice(0, 3).map((item, index) => ({
    id: `priority-${index}`,
    type: "Priority",
    detail: `${item.title} · ${item.impact}`,
    time: item.horizon
  }));

  for (const connector of integrations.filter((item) => item.connected).slice(0, 2)) {
    activities.push({
      id: `connector-${connector.id}`,
      type: "Connector",
      detail: `${connector.name} sincronizado em modo ${connector.syncMode ?? "manual"}`,
      time: connector.status
    });
  }

  for (const usageRow of usage.recent.slice(0, 2)) {
    activities.push({
      id: `${usageRow.module}-${usageRow.at}`,
      type: "AI usage",
      detail: `${usageRow.workflow} via ${usageRow.model} · ${usageRow.totalTokens} tokens`,
      time: relativeTime(usageRow.at)
    });
  }

  return activities.slice(0, 6);
}

function normalizeSyncPayload(sourceType: string, rawPayload: Record<string, string>) {
  if (sourceType === "manual_upload") {
    return {
      filePaths: (rawPayload.filePaths ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (!value) continue;
    normalized[key] = key === "limit" ? Number(value) : value;
  }
  return normalized;
}

function relativeTime(input: string) {
  const timestamp = Date.parse(input);
  if (!Number.isFinite(timestamp)) return "agora";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60)));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function createFallbackSummary(): DashboardSummary {
  return {
    tenantId: DEFAULT_TENANT_ID,
    latestVersion: "not-generated",
    totalEntities: 0,
    entitiesByType: {},
    businessMetrics: [],
    overview: {
      primaryFocus: "none",
      gaps: ["Lead sem dados", "Payment sem dados"],
      industry: "General Business",
      readinessScore: 0,
      topSignal: "Connect your first production source."
    }
  };
}

function createFallbackIndustry(): IndustryProfile {
  return {
    primaryIndustry: "general",
    label: "General Business",
    description: "Connect CRM, finance and website data to activate a grounded cross-domain copilot.",
    confidence: "low",
    signals: ["No production connector has been synced yet."],
    kpis: [],
    businessMetrics: [],
    recommendedConnectors: [
      {
        connectorType: "crm",
        domain: "sales",
        priority: "high",
        reason: "CRM is missing, so Direct cannot measure demand quality."
      }
    ],
    readiness: {
      overallScore: 0,
      freshnessScore: 0,
      sourceBreadth: 0,
      missingDomains: ["sales", "finance", "digital"],
      confidence: "low",
      domainCoverage: {
        sales: { present: false, entityCount: 0, connectorCount: 0, score: 0 },
        finance: { present: false, entityCount: 0, connectorCount: 0, score: 0 },
        operations: { present: false, entityCount: 0, connectorCount: 0, score: 0 },
        digital: { present: false, entityCount: 0, connectorCount: 0, score: 0 },
        customer: { present: false, entityCount: 0, connectorCount: 0, score: 0 },
        knowledge: { present: false, entityCount: 0, connectorCount: 0, score: 0 }
      }
    }
  };
}

function createFallbackExecutionPlan(industry: IndustryProfile) {
  return {
    primaryIndustry: industry.primaryIndustry,
    readinessScore: industry.readiness.overallScore,
    priorities: [
      {
        title: "Connect CRM and finance first",
        why: "Those two domains unlock most commercial and profitability diagnostics.",
        impact: "revenue" as const,
        horizon: "now" as const
      }
    ],
    connectorRecommendations: industry.recommendedConnectors
  };
}

function createFallbackUsage(): UsageSummary {
  return {
    tenantId: DEFAULT_TENANT_ID,
    totalTokens: 0,
    totalCost: 0,
    requests: 0,
    modules: {},
    recent: []
  };
}

async function safeGet<T>(path: string) {
  try {
    const response = await http.get<T>(path);
    return response.data;
  } catch {
    return null;
  }
}
