import { startTransition, useDeferredValue, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  CreditCard,
  Languages,
  LayoutDashboard,
  Link2,
  LogOut,
  Radar,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Upload
} from "lucide-react";
import { useAuth } from "./app/auth";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  askCopilot,
  connectIntegration,
  copilotSuggestions,
  fetchDashboard,
  integrationCategories,
  supportedIntegrations,
  toneFromStatus,
  views,
  viewFromPath,
  type CopilotResponse,
  type RuntimeConnector,
  type ViewKey
} from "./lib/dashboard";

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      meta: Pick<CopilotResponse, "confidence" | "confidenceScore" | "modelRoute" | "usage" | "evidence">;
    };

const viewIcons = {
  painel: LayoutDashboard,
  integracoes: Link2,
  copiloto: BrainCircuit,
  configuracoes: Settings
} as const;

const languageOptions = [
  { value: "pt-BR", label: "PT-BR" },
  { value: "en", label: "EN" },
  { value: "es", label: "ES" }
] as const;

function normalizeLanguage(lang: string) {
  if (lang.startsWith("pt")) return "pt-BR";
  if (lang.startsWith("es")) return "es";
  return "en";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeView = viewFromPath(location.pathname);
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [activeCategory, setActiveCategory] = useState("all");
  const deferredCategory = useDeferredValue(activeCategory);
  const [connectModal, setConnectModal] = useState<RuntimeConnector | null>(null);
  const [connectorForm, setConnectorForm] = useState<Record<string, string>>({});
  const [copilotInput, setCopilotInput] = useState("");
  const [sessionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Estou lendo o contexto consolidado do tenant. Pergunte sobre prontidao de dados, lacunas operacionais ou proxima melhor acao.",
      meta: {
        confidence: "medium",
        confidenceScore: 0.58,
        modelRoute: {
          workflow: "chat",
          modelClass: "balanced",
          providerHint: "openrouter",
          responseMode: "standard"
        },
        usage: {
          model: "bootstrap",
          totalTokens: 0,
          estimatedCost: 0
        },
        evidence: []
      }
    }
  ]);

  const dashboardQuery = useQuery({
    queryKey: ["direct-console", "dashboard"],
    queryFn: fetchDashboard
  });

  const connectMutation = useMutation({
    mutationFn: (input: { sourceType: string; payload: Record<string, string> }) =>
      connectIntegration(input.sourceType, input.payload),
    onSuccess: async () => {
      setConnectModal(null);
      setConnectorForm({});
      await dashboardQuery.refetch();
    }
  });

  const copilotMutation = useMutation({
    mutationFn: (question: string) => askCopilot(question, sessionId),
    onSuccess: (response) => {
      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            id: globalThis.crypto?.randomUUID?.() ?? `assistant-${Date.now()}`,
            role: "assistant",
            content: response.answer,
            meta: {
              confidence: response.confidence,
              confidenceScore: response.confidenceScore,
              modelRoute: response.modelRoute,
              usage: response.usage,
              evidence: response.evidence
            }
          }
        ]);
      });
      void dashboardQuery.refetch();
    }
  });

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function openConnectModal(connector: RuntimeConnector) {
    const definition = supportedIntegrations.find((item) => item.sourceType === connector.sourceType);
    startTransition(() => {
      setConnectModal(connector);
      setConnectorForm(
        Object.fromEntries((definition?.fields ?? []).map((field) => [field.key, connectorForm[field.key] ?? ""]))
      );
    });
  }

  function handleConnectSave() {
    if (!connectModal) return;
    connectMutation.mutate({
      sourceType: connectModal.sourceType,
      payload: connectorForm
    });
  }

  function handleSendQuestion() {
    const question = copilotInput.trim();
    if (!question || copilotMutation.isPending) return;

    startTransition(() => {
      setMessages((current) => [
        ...current,
        {
          id: globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`,
          role: "user",
          content: question
        }
      ]);
      setCopilotInput("");
    });

    copilotMutation.mutate(question);
  }

  const dashboard = dashboardQuery.data;
  const filteredIntegrations = (dashboard?.integrations ?? []).filter(
    (item) => deferredCategory === "all" || item.category === deferredCategory
  );
  const activeConnectorDefinition = supportedIntegrations.find(
    (item) => item.sourceType === connectModal?.sourceType
  );

  return (
    <div className="shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span>D</span>
          </div>
          <div>
            <div className="brand-title">DIRECT</div>
            <div className="brand-subtitle">{t("brand.subtitle")}</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {views.map((view) => {
            const Icon = viewIcons[view.id];
            return (
              <NavLink
                key={view.id}
                to={view.path}
                end={view.path === "/"}
                className={({ isActive }) => `nav-item${isActive ? " nav-item-active" : ""}`}
              >
                <span className="nav-row">
                  <Icon className="nav-icon" size={18} strokeWidth={1.8} />
                  <span>
                    <span className="nav-eyebrow">{t(view.eyebrowKey)}</span>
                    <span className="nav-label">{t(view.labelKey)}</span>
                  </span>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.avatarInitials ?? "??"}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-plan">{t(`plans.${user?.plan ?? "starter"}.name`)}</span>
          </div>
          <div className="sidebar-user-actions">
            <button className="sidebar-icon-btn" onClick={() => navigate("/planos")} title={t("sidebar.managePlan")}>
              <CreditCard size={15} />
            </button>
            <button className="sidebar-icon-btn" onClick={handleLogout} title={t("auth.logout")}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">{t("topbar.eyebrow")}</div>
            <h1>{t("topbar.greeting", { name: user?.name ?? "" })}</h1>
          </div>
          <div className="topbar-actions">
            <label className="stat-chip stat-chip-language" htmlFor="console-language">
              <Languages size={14} />
              <select
                id="console-language"
                className="language-select"
                value={activeLanguage}
                onChange={(event) => void i18n.changeLanguage(event.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeView === "painel" && (
              <section className="dashboard-layout">
                <div className="metric-grid">
                  {dashboard?.metrics.map((metric) => (
                    <article key={metric.label} className={`metric-card metric-${metric.tone}`}>
                      <span className="metric-label">{metric.label}</span>
                      <strong>{metric.value}</strong>
                      <span className="metric-delta">{metric.delta}</span>
                    </article>
                  ))}
                </div>

                <div className="dashboard-grid">
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">Business signal</div>
                        <h2>{dashboard?.industryProfile.label ?? "Industry profile"}</h2>
                      </div>
                      <Radar size={18} className="panel-icon" />
                    </div>
                    <div className="executive-grid">
                      <article className="insight-card">
                        <span className="signal-area">Primary fit</span>
                        <h4>{dashboard?.industryProfile.label ?? "General Business"}</h4>
                        <p>{dashboard?.industryProfile.description}</p>
                        <div className="chip-row">
                          <span className={`pill pill-${toneFromStatus(confidenceTone(dashboard?.industryProfile.confidence))}`}>
                            Confidence {dashboard?.industryProfile.confidence ?? "low"}
                          </span>
                          <span className="pill">{dashboard?.readiness.overallScore ?? 0}/100 readiness</span>
                        </div>
                      </article>

                      <article className="insight-card">
                        <span className="signal-area">Top signals</span>
                        <ul className="stack-list">
                          {(dashboard?.industryProfile.signals ?? []).slice(0, 3).map((signal) => (
                            <li key={signal}>{signal}</li>
                          ))}
                        </ul>
                      </article>

                      <article className="insight-card">
                        <span className="signal-area">AI usage</span>
                        <h4>${dashboard?.usage?.totalCost?.toFixed(2) ?? "0.00"}</h4>
                        <p>
                          {Intl.NumberFormat("en-US").format(dashboard?.usage?.totalTokens ?? 0)} tokens across{" "}
                          {dashboard?.usage?.requests ?? 0} requests.
                        </p>
                      </article>
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">{t("dashboard.chartEyebrow")}</div>
                        <h2>{t("dashboard.chartTitle")}</h2>
                      </div>
                    </div>
                    <div className="chart-shell">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={dashboard?.revenueSeries}>
                          <defs>
                            <linearGradient id="receitaFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#13d5a6" stopOpacity={0.38} />
                              <stop offset="95%" stopColor="#13d5a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="despesaFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(64,93,132,0.24)" />
                          <XAxis dataKey="month" stroke="#93a9cb" tickLine={false} axisLine={false} />
                          <YAxis stroke="#93a9cb" tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(8,18,32,0.96)",
                              border: "1px solid rgba(38,63,96,0.68)",
                              borderRadius: "16px",
                              color: "#ebf2ff"
                            }}
                          />
                          <Area type="monotone" dataKey="receita" stroke="#13d5a6" fill="url(#receitaFill)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="despesas" stroke="#ff5a1f" fill="url(#despesaFill)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                <div className="dashboard-grid">
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">Readiness</div>
                        <h3>Data coverage by domain</h3>
                      </div>
                      <ShieldAlert size={18} className="panel-icon" />
                    </div>
                    <div className="coverage-list">
                      {Object.entries(dashboard?.readiness.domainCoverage ?? {}).map(([domain, coverage]) => (
                        <article key={domain} className="coverage-card">
                          <div className="coverage-top">
                            <strong>{domain}</strong>
                            <span>{coverage.score}/100</span>
                          </div>
                          <div className="coverage-bar">
                            <span style={{ width: `${coverage.score}%` }} />
                          </div>
                          <p>
                            {coverage.entityCount} entities · {coverage.connectorCount} connectors
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">Execution plan</div>
                        <h3>Next priorities</h3>
                      </div>
                      <Sparkles size={18} className="panel-icon" />
                    </div>
                    <div className="priority-list">
                      {(dashboard?.executionPlan?.priorities ?? []).map((priority) => (
                        <article key={priority.title} className="priority-card">
                          <div className="priority-header">
                            <h4>{priority.title}</h4>
                            <span className="pill">{priority.horizon}</span>
                          </div>
                          <p>{priority.why}</p>
                          <span className="signal-area">{priority.impact}</span>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("dashboard.activityEyebrow")}</div>
                      <h3>{t("dashboard.activityTitle")}</h3>
                    </div>
                  </div>
                  <div className="activity-list">
                    {(dashboard?.recentActivity ?? []).map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-dot" />
                        <div className="activity-content">
                          <span className="activity-type">{activity.type}</span>
                          <span className="activity-detail">{activity.detail}</span>
                        </div>
                        <span className="activity-time">
                          <Clock size={12} /> {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {activeView === "integracoes" && (
              <section className="integrations-layout">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("integrations.eyebrow")}</div>
                      <h2>{t("integrations.title")}</h2>
                    </div>
                  </div>
                  <p className="integrations-desc">{t("integrations.desc")}</p>

                  <div className="category-tabs">
                    {integrationCategories.map((category) => (
                      <button
                        key={category.id}
                        className={`category-tab${activeCategory === category.id ? " category-tab-active" : ""}`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>

                  <div className="integrations-grid">
                    {filteredIntegrations.map((integration) => (
                      <article key={integration.id} className="integration-card">
                        <div className="integration-top">
                          <div>
                            <h3>{integration.name}</h3>
                            <p>{integration.description}</p>
                          </div>
                          <span className={`pill pill-${toneFromStatus(integration.status)}`}>{integration.status}</span>
                        </div>

                        <div className="integration-meta-stack">
                          <span className="signal-area">Coverage</span>
                          <div className="chip-row">
                            {integration.coverage.map((item) => (
                              <span key={item} className="pill">
                                {item}
                              </span>
                            ))}
                          </div>
                          <p>{integration.credentialsHint}</p>
                          {integration.reason ? <p>{integration.reason}</p> : null}
                        </div>

                        <button
                          className={integration.connected ? "btn-connected" : "btn-connect"}
                          onClick={() => openConnectModal(integration)}
                        >
                          {integration.connected ? "Re-sync" : "Connect"}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="panel upload-panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">Connector recommendations</div>
                      <h3>Missing sources by value</h3>
                    </div>
                    <Upload size={18} className="panel-icon" />
                  </div>

                  <div className="recommendation-list">
                    {(dashboard?.recommendations ?? []).map((recommendation) => (
                      <article key={recommendation.connectorType} className="recommendation-card">
                        <div className="priority-header">
                          <h4>{recommendation.connectorType}</h4>
                          <span className="pill">{recommendation.priority}</span>
                        </div>
                        <p>{recommendation.reason}</p>
                        <span className="signal-area">{recommendation.domain}</span>
                      </article>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {connectModal && activeConnectorDefinition && (
                    <motion.div
                      className="modal-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setConnectModal(null)}
                    >
                      <motion.div
                        className="modal-glass"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.22 }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <h2>{connectModal.name}</h2>
                        <p>{connectModal.description}</p>
                        <div className="modal-field-list">
                          {activeConnectorDefinition.fields.map((field) => (
                            <div key={field.key} className="modal-field-group">
                              <label className="auth-label">{field.label}</label>
                              <input
                                type="text"
                                className="auth-input"
                                placeholder={field.placeholder}
                                value={connectorForm[field.key] ?? ""}
                                onChange={(event) =>
                                  setConnectorForm((current) => ({
                                    ...current,
                                    [field.key]: event.target.value
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <p className="modal-hint">
                          Required secrets stay in environment variables: {activeConnectorDefinition.credentialsEnvKeys.join(", ") || "none"}.
                        </p>
                        {connectMutation.isError ? (
                          <p className="modal-error">Connection failed. Check env vars and connector payload.</p>
                        ) : null}
                        <div className="modal-actions">
                          <button className="btn-outline btn-sm" onClick={() => setConnectModal(null)}>
                            {t("integrations.cancel")}
                          </button>
                          <button className="btn-primary btn-sm" onClick={handleConnectSave} disabled={connectMutation.isPending}>
                            {connectMutation.isPending ? "Syncing..." : "Save and sync"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {activeView === "copiloto" && (
              <section className="copilot-layout">
                <div className="panel copilot-panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("copilot.eyebrow")}</div>
                      <h2>{t("copilot.title")}</h2>
                    </div>
                    <BrainCircuit size={20} className="panel-icon" />
                  </div>

                  <div className="copilot-chat">
                    <div className="copilot-messages">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`copilot-msg ${message.role === "assistant" ? "copilot-msg-ai" : "copilot-msg-user"}`}
                        >
                          <div className="copilot-msg-avatar">
                            {message.role === "assistant" ? <BrainCircuit size={16} /> : <span>U</span>}
                          </div>
                          <div className="copilot-msg-content">
                            <p>{message.content}</p>
                            {"meta" in message ? (
                              <div className="copilot-meta">
                                <span className="pill">confidence {message.meta.confidenceScore}</span>
                                <span className="pill">{message.meta.modelRoute.workflow}</span>
                                <span className="pill">{message.meta.modelRoute.modelClass}</span>
                                <span className="pill">${message.meta.usage.estimatedCost.toFixed(4)}</span>
                              </div>
                            ) : null}
                            {"meta" in message && message.meta.evidence.length > 0 ? (
                              <div className="copilot-evidence">
                                {message.meta.evidence.slice(0, 2).map((item) => (
                                  <span key={`${item.title}-${item.source}`} className="pill">
                                    {item.title}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="copilot-input-bar">
                      <input
                        type="text"
                        className="copilot-input"
                        placeholder={t("copilot.placeholder")}
                        value={copilotInput}
                        onChange={(event) => setCopilotInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSendQuestion();
                          }
                        }}
                      />
                      <button className="copilot-send" onClick={handleSendQuestion} disabled={copilotMutation.isPending}>
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="copilot-suggestions">
                    <span className="eyebrow">{t("copilot.suggestionsLabel")}</span>
                    <div className="copilot-suggestion-chips">
                      {copilotSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          className="suggestion-chip"
                          onClick={() => setCopilotInput(suggestion)}
                        >
                          {suggestion} <ArrowUpRight size={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeView === "configuracoes" && (
              <section className="settings-layout">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("settings.eyebrow")}</div>
                      <h2>{t("settings.title")}</h2>
                    </div>
                  </div>

                  <div className="settings-grid">
                    <div className="settings-section">
                      <h3>{t("settings.accountTitle")}</h3>
                      <div className="settings-row">
                        <span className="settings-label">{t("auth.name")}</span>
                        <span className="settings-value">{user?.name}</span>
                      </div>
                      <div className="settings-row">
                        <span className="settings-label">{t("auth.email")}</span>
                        <span className="settings-value">{user?.email}</span>
                      </div>
                      <div className="settings-row">
                        <span className="settings-label">{t("settings.plan")}</span>
                        <span className="settings-value settings-plan-badge">{t(`plans.${user?.plan ?? "starter"}.name`)}</span>
                      </div>
                      <button className="btn-outline btn-sm" onClick={() => navigate("/planos")}>
                        {t("settings.changePlan")}
                      </button>
                    </div>

                    <div className="settings-section">
                      <h3>{t("settings.langTitle")}</h3>
                      <p className="settings-desc">{t("settings.langDesc")}</p>
                      <div className="settings-lang-options">
                        {languageOptions.map((option) => (
                          <button
                            key={option.value}
                            className={`lang-btn${activeLanguage === option.value ? " lang-btn-active" : ""}`}
                            onClick={() => void i18n.changeLanguage(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function confidenceTone(confidence: CopilotResponse["confidence"] | undefined) {
  if (confidence === "high") return "healthy";
  if (confidence === "medium") return "warning";
  return "disconnected";
}
