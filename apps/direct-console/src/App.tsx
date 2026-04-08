import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  LayoutDashboard,
  Link2,
  LogOut,
  BrainCircuit,
  Settings,
  Languages,
  Upload,
  Clock,
  ArrowUpRight,
  Send
} from "lucide-react";
import { useAuth } from "./app/auth";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
  fetchDashboard,
  integrationsCatalog,
  integrationCategories,
  views,
  viewFromPath,
  toneFromStatus
} from "./lib/dashboard";

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
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [copilotInput, setCopilotInput] = useState("");

  const dashboardQuery = useQuery({
    queryKey: ["direct-console", "dashboard"],
    queryFn: fetchDashboard
  });

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const filteredIntegrations = integrationsCatalog.filter(
    (i) => activeCategory === "all" || i.category === activeCategory
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
                className={({ isActive }) =>
                  `nav-item${isActive ? " nav-item-active" : ""}`
                }
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
            <span className="sidebar-user-plan">
              {t(`plans.${user?.plan ?? "starter"}.name`)}
            </span>
          </div>
          <div className="sidebar-user-actions">
            <button
              className="sidebar-icon-btn"
              onClick={() => navigate("/planos")}
              title={t("sidebar.managePlan")}
            >
              <CreditCard size={15} />
            </button>
            <button
              className="sidebar-icon-btn"
              onClick={handleLogout}
              title={t("auth.logout")}
            >
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
                onChange={(e) => void i18n.changeLanguage(e.target.value)}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
            {/* ─── PAINEL ───────────────────────────────────────── */}
            {activeView === "painel" && (
              <section className="dashboard-layout">
                {/* KPI Cards */}
                <div className="metric-grid">
                  {dashboardQuery.data?.metrics.map((m) => (
                    <article key={m.labelKey} className={`metric-card metric-${m.tone}`}>
                      <span className="metric-label">{t(m.labelKey)}</span>
                      <strong>{m.value}</strong>
                      <span className="metric-delta">{t(m.deltaKey)}</span>
                    </article>
                  ))}
                </div>

                <div className="dashboard-grid">
                  {/* Revenue Chart */}
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">{t("dashboard.chartEyebrow")}</div>
                        <h2>{t("dashboard.chartTitle")}</h2>
                      </div>
                    </div>
                    <div className="chart-shell">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={dashboardQuery.data?.revenueSeries}>
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

                  {/* Recent Activity */}
                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="eyebrow">{t("dashboard.activityEyebrow")}</div>
                        <h3>{t("dashboard.activityTitle")}</h3>
                      </div>
                    </div>
                    <div className="activity-list">
                      {dashboardQuery.data?.recentActivity.map((a) => (
                        <div key={a.id} className="activity-item">
                          <div className="activity-dot" />
                          <div className="activity-content">
                            <span className="activity-type">{t(a.typeKey)}</span>
                            <span className="activity-detail">{a.detail}</span>
                          </div>
                          <span className="activity-time">
                            <Clock size={12} /> {a.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* AI Insights */}
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("dashboard.insightsEyebrow")}</div>
                      <h3>{t("dashboard.insightsTitle")}</h3>
                    </div>
                    <BrainCircuit size={18} className="panel-icon" />
                  </div>
                  <div className="insights-grid">
                    {dashboardQuery.data?.copilotInsights.map((ins) => (
                      <article key={ins.areaKey} className="insight-card">
                        <span className="signal-area">{t(ins.areaKey)}</span>
                        <h4>{t(ins.headingKey)}</h4>
                        <p>{t(ins.bodyKey)}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {/* ─── INTEGRAÇÕES ──────────────────────────────────── */}
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
                    {integrationCategories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`category-tab${activeCategory === cat.id ? " category-tab-active" : ""}`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        {t(cat.labelKey)}
                      </button>
                    ))}
                  </div>

                  <div className="integrations-grid">
                    {filteredIntegrations.map((integration) => (
                      <article key={integration.id} className="integration-card">
                        <div className="integration-icon">{integration.icon}</div>
                        <div className="integration-info">
                          <h3>{integration.name}</h3>
                          <p>{t(integration.description)}</p>
                        </div>
                        <button
                          className={integration.connected ? "btn-connected" : "btn-connect"}
                          onClick={() => setConnectModal(integration.id)}
                        >
                          {integration.connected
                            ? t("integrations.connected")
                            : t("integrations.connect")}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                {/* Upload de arquivos */}
                <div className="panel upload-panel">
                  <div className="panel-header">
                    <div>
                      <div className="eyebrow">{t("integrations.uploadEyebrow")}</div>
                      <h3>{t("integrations.uploadTitle")}</h3>
                    </div>
                    <Upload size={18} className="panel-icon" />
                  </div>
                  <div className="upload-zone">
                    <Upload size={32} strokeWidth={1.2} />
                    <p>{t("integrations.uploadHint")}</p>
                    <button className="btn-outline btn-sm">{t("integrations.uploadBtn")}</button>
                  </div>
                </div>

                {/* Modal placeholder */}
                <AnimatePresence>
                  {connectModal && (
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2>{t("integrations.connectModalTitle")}</h2>
                        <p>{t("integrations.connectModalDesc")}</p>
                        <div className="modal-field-group">
                          <label className="auth-label">{t("integrations.connectLabel")}</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder={t("integrations.connectPlaceholder")}
                          />
                        </div>
                        <div className="modal-actions">
                          <button className="btn-outline btn-sm" onClick={() => setConnectModal(null)}>
                            {t("integrations.cancel")}
                          </button>
                          <button className="btn-primary btn-sm" onClick={() => setConnectModal(null)}>
                            {t("integrations.save")}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* ─── COPILOTO IA ──────────────────────────────────── */}
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
                      <div className="copilot-msg copilot-msg-ai">
                        <div className="copilot-msg-avatar">
                          <BrainCircuit size={16} />
                        </div>
                        <div className="copilot-msg-content">
                          <p>{t("copilot.welcome")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="copilot-input-bar">
                      <input
                        type="text"
                        className="copilot-input"
                        placeholder={t("copilot.placeholder")}
                        value={copilotInput}
                        onChange={(e) => setCopilotInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setCopilotInput("");
                          }
                        }}
                      />
                      <button className="copilot-send" onClick={() => setCopilotInput("")}>
                        <Send size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="copilot-suggestions">
                    <span className="eyebrow">{t("copilot.suggestionsLabel")}</span>
                    <div className="copilot-suggestion-chips">
                      <button className="suggestion-chip" onClick={() => setCopilotInput(t("copilot.s1"))}>
                        {t("copilot.s1")} <ArrowUpRight size={13} />
                      </button>
                      <button className="suggestion-chip" onClick={() => setCopilotInput(t("copilot.s2"))}>
                        {t("copilot.s2")} <ArrowUpRight size={13} />
                      </button>
                      <button className="suggestion-chip" onClick={() => setCopilotInput(t("copilot.s3"))}>
                        {t("copilot.s3")} <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ─── CONFIGURAÇÕES ────────────────────────────────── */}
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
                        <span className="settings-value settings-plan-badge">
                          {t(`plans.${user?.plan ?? "starter"}.name`)}
                        </span>
                      </div>
                      <button className="btn-outline btn-sm" onClick={() => navigate("/planos")}>
                        {t("settings.changePlan")}
                      </button>
                    </div>

                    <div className="settings-section">
                      <h3>{t("settings.langTitle")}</h3>
                      <p className="settings-desc">{t("settings.langDesc")}</p>
                      <div className="settings-lang-options">
                        {languageOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`lang-btn${activeLanguage === opt.value ? " lang-btn-active" : ""}`}
                            onClick={() => void i18n.changeLanguage(opt.value)}
                          >
                            {opt.label}
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
