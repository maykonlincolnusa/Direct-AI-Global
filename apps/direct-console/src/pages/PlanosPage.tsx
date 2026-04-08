import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth";
import { Check, Zap, Building2, Rocket, LogOut, User, Languages } from "lucide-react";

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

export function PlanosPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  function handlePlan(plan: string) {
    // Aqui chama o endpoint de checkout (Stripe, etc.) — por ora navega pro dashboard
    console.info("Plano selecionado:", plan);
    navigate("/");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const plans = [
    {
      id: "starter",
      icon: Rocket,
      nameKey: "plans.starter.name",
      priceKey: "plans.starter.price",
      periodKey: "plans.period",
      descKey: "plans.starter.desc",
      features: [
        "plans.starter.f1",
        "plans.starter.f2",
        "plans.starter.f3",
        "plans.starter.f4"
      ],
      highlighted: false,
      ctaKey: "plans.cta"
    },
    {
      id: "pro",
      icon: Zap,
      nameKey: "plans.pro.name",
      priceKey: "plans.pro.price",
      periodKey: "plans.period",
      descKey: "plans.pro.desc",
      features: [
        "plans.pro.f1",
        "plans.pro.f2",
        "plans.pro.f3",
        "plans.pro.f4",
        "plans.pro.f5"
      ],
      highlighted: true,
      ctaKey: "plans.ctaPro"
    },
    {
      id: "enterprise",
      icon: Building2,
      nameKey: "plans.enterprise.name",
      priceKey: "plans.enterprise.price",
      periodKey: "plans.period",
      descKey: "plans.enterprise.desc",
      features: [
        "plans.enterprise.f1",
        "plans.enterprise.f2",
        "plans.enterprise.f3",
        "plans.enterprise.f4",
        "plans.enterprise.f5",
        "plans.enterprise.f6"
      ],
      highlighted: false,
      ctaKey: "plans.ctaEnterprise"
    }
  ];

  return (
    <div className="plans-shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <header className="plans-header">
        <div className="auth-logo">
          <div className="brand-mark brand-mark-sm">
            <span>D</span>
          </div>
          <span className="auth-logo-name">DIRECT</span>
        </div>

        <div className="plans-header-actions">
          <label className="stat-chip stat-chip-language" htmlFor="plans-language">
            <Languages size={14} />
            <select
              id="plans-language"
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

          {user && (
            <>
              <div className="plans-user-chip">
                <User size={14} />
                <span>{user.name}</span>
              </div>
              <button
                className="btn-ghost-sm"
                onClick={handleLogout}
                aria-label={t("auth.logout")}
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="plans-main">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="plans-hero"
        >
          <div className="eyebrow">{t("plans.eyebrow")}</div>
          <h1 className="plans-title">{t("plans.title")}</h1>
          <p className="plans-subtitle">{t("plans.subtitle")}</p>
        </motion.div>

        <div className="plans-grid">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.article
                key={plan.id}
                className={`plan-card${plan.highlighted ? " plan-highlighted" : ""}`}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: "easeOut", delay: index * 0.08 }}
              >
                {plan.highlighted && (
                  <div className="plan-badge">{t("plans.popular")}</div>
                )}

                <div className="plan-icon-wrap">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <h2 className="plan-name">{t(plan.nameKey)}</h2>
                <p className="plan-desc">{t(plan.descKey)}</p>

                <div className="plan-price-row">
                  <span className="plan-price">{t(plan.priceKey)}</span>
                  <span className="plan-period">/{t(plan.periodKey)}</span>
                </div>

                <ul className="plan-features">
                  {plan.features.map((fk) => (
                    <li key={fk}>
                      <Check size={15} className="plan-check" />
                      <span>{t(fk)}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={plan.highlighted ? "btn-primary" : "btn-outline"}
                  onClick={() => handlePlan(plan.id)}
                >
                  {t(plan.ctaKey)}
                </button>
              </motion.article>
            );
          })}
        </div>

        <p className="plans-disclaimer">{t("plans.disclaimer")}</p>
      </main>
    </div>
  );
}
