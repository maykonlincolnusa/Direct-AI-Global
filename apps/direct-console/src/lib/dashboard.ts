import { http } from "./http";

const DEFAULT_TENANT_ID = import.meta.env.VITE_DIRECT_TENANT_ID ?? "tenant-demo";

/* ─── Types ──────────────────────────────────────────────────────── */

export type ViewKey = "painel" | "integracoes" | "copiloto" | "configuracoes";

export type ConnectorStatus = "healthy" | "syncing" | "warning" | "disconnected";
export type MetricTone = "orange" | "teal" | "blue" | "gold" | "violet";

export type Integration = {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: ConnectorStatus;
  description: string;
  connected: boolean;
};

export type DashboardMetric = {
  labelKey: string;
  value: string;
  deltaKey: string;
  tone: MetricTone;
};

/* ─── Views ──────────────────────────────────────────────────────── */

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

/* ─── Dashboard Data ─────────────────────────────────────────────── */

export const dashboardMetrics: DashboardMetric[] = [
  { labelKey: "dashboard.revenue", value: "R$ 84.200", deltaKey: "dashboard.revenueDelta", tone: "teal" },
  { labelKey: "dashboard.leads", value: "127", deltaKey: "dashboard.leadsDelta", tone: "orange" },
  { labelKey: "dashboard.conversions", value: "34", deltaKey: "dashboard.conversionsDelta", tone: "blue" },
  { labelKey: "dashboard.activeSources", value: "8", deltaKey: "dashboard.activeSourcesDelta", tone: "gold" }
];

export const revenueSeries = [
  { month: "Jan", receita: 52000, despesas: 38000 },
  { month: "Fev", receita: 58000, despesas: 40000 },
  { month: "Mar", receita: 64000, despesas: 42000 },
  { month: "Abr", receita: 71000, despesas: 41000 },
  { month: "Mai", receita: 78000, despesas: 44000 },
  { month: "Jun", receita: 84200, despesas: 45000 }
];

export const recentActivity = [
  { id: "1", typeKey: "activity.newLead", detail: "Maria Silva — via Instagram", time: "12min" },
  { id: "2", typeKey: "activity.payment", detail: "Fatura #1042 — R$ 3.200", time: "28min" },
  { id: "3", typeKey: "activity.fileUpload", detail: "Relatório Q1 2026.pdf", time: "1h" },
  { id: "4", typeKey: "activity.socialMention", detail: "@direct_ia no Twitter", time: "2h" },
  { id: "5", typeKey: "activity.newLead", detail: "João Ferreira — via WhatsApp", time: "3h" }
];

export const copilotInsights = [
  {
    areaKey: "copilot.sales",
    headingKey: "copilot.salesHeading",
    bodyKey: "copilot.salesBody"
  },
  {
    areaKey: "copilot.finance",
    headingKey: "copilot.financeHeading",
    bodyKey: "copilot.financeBody"
  },
  {
    areaKey: "copilot.operations",
    headingKey: "copilot.operationsHeading",
    bodyKey: "copilot.operationsBody"
  }
];

/* ─── Integrations Catalog ───────────────────────────────────────── */

export const integrationsCatalog: Integration[] = [
  {
    id: "website",
    name: "Website",
    icon: "🌐",
    category: "digital",
    status: "disconnected",
    description: "integrations.website.desc",
    connected: false
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    category: "social",
    status: "disconnected",
    description: "integrations.instagram.desc",
    connected: false
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    category: "social",
    status: "disconnected",
    description: "integrations.whatsapp.desc",
    connected: false
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👤",
    category: "social",
    status: "disconnected",
    description: "integrations.facebook.desc",
    connected: false
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    category: "social",
    status: "disconnected",
    description: "integrations.tiktok.desc",
    connected: false
  },
  {
    id: "google_business",
    name: "Google Meu Negócio",
    icon: "📍",
    category: "digital",
    status: "disconnected",
    description: "integrations.google.desc",
    connected: false
  },
  {
    id: "crm",
    name: "CRM",
    icon: "🤝",
    category: "business",
    status: "disconnected",
    description: "integrations.crm.desc",
    connected: false
  },
  {
    id: "erp",
    name: "ERP",
    icon: "🏭",
    category: "business",
    status: "disconnected",
    description: "integrations.erp.desc",
    connected: false
  },
  {
    id: "financeiro",
    name: "Financeiro",
    icon: "💰",
    category: "business",
    status: "disconnected",
    description: "integrations.financeiro.desc",
    connected: false
  },
  {
    id: "arquivos",
    name: "Arquivos",
    icon: "📁",
    category: "dados",
    status: "disconnected",
    description: "integrations.arquivos.desc",
    connected: false
  },
  {
    id: "email",
    name: "E-mail Marketing",
    icon: "✉️",
    category: "marketing",
    status: "disconnected",
    description: "integrations.email.desc",
    connected: false
  },
  {
    id: "analytics",
    name: "Google Analytics",
    icon: "📊",
    category: "digital",
    status: "disconnected",
    description: "integrations.analytics.desc",
    connected: false
  }
];

export const integrationCategories = [
  { id: "all", labelKey: "integrations.catAll" },
  { id: "social", labelKey: "integrations.catSocial" },
  { id: "digital", labelKey: "integrations.catDigital" },
  { id: "business", labelKey: "integrations.catBusiness" },
  { id: "dados", labelKey: "integrations.catData" },
  { id: "marketing", labelKey: "integrations.catMarketing" }
];

/* ─── API Helpers ────────────────────────────────────────────────── */

export async function fetchDashboard() {
  const summary = await safeGet<{ totalEntities: number }>(
    `/tenants/${DEFAULT_TENANT_ID}/context/summary`
  );
  // Return mock data if API not available
  return {
    metrics: dashboardMetrics,
    revenueSeries,
    recentActivity,
    copilotInsights,
    totalEntities: summary?.totalEntities ?? 148000
  };
}

export function toneFromStatus(status: ConnectorStatus) {
  if (status === "healthy") return "teal";
  if (status === "syncing") return "blue";
  if (status === "disconnected") return "dim";
  return "gold";
}

export function viewFromPath(pathname: string): ViewKey {
  return views.find((v) => v.path === pathname)?.id ?? "painel";
}

async function safeGet<T>(path: string) {
  try {
    const response = await http.get<T>(path);
    return response.data;
  } catch {
    return null;
  }
}
