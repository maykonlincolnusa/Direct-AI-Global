import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth";
import { Languages } from "lucide-react";

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

const cadastroSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"]
  });

type CadastroValues = z.infer<typeof cadastroSchema>;

export function CadastroPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  const form = useForm<CadastroValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" }
  });

  function onSubmit(data: CadastroValues) {
    // Simulação — substituir por chamada real à API
    login({
      id: "usr_" + Math.random().toString(36).slice(2),
      name: data.name,
      email: data.email,
      plan: "starter",
      avatarInitials: data.name.slice(0, 2).toUpperCase()
    });
    navigate("/planos");
  }

  return (
    <div className="auth-shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <header className="auth-lang-bar">
        <label className="stat-chip stat-chip-language" htmlFor="cadastro-language">
          <Languages size={14} />
          <select
            id="cadastro-language"
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
      </header>

      <motion.div
        className="auth-glass"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="auth-logo">
          <div className="brand-mark">
            <span>D</span>
          </div>
          <span className="auth-logo-name">DIRECT</span>
        </div>

        <h1 className="auth-title">{t("auth.registerTitle")}</h1>
        <p className="auth-subtitle">{t("auth.registerSubtitle")}</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form" noValidate>
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-name">
              {t("auth.name")}
            </label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              placeholder={t("auth.namePlaceholder")}
              autoComplete="name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <span className="auth-field-error">{t("auth.nameMin")}</span>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-email">
              {t("auth.email")}
            </label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="voce@empresa.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <span className="auth-field-error">{t("auth.emailInvalid")}</span>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-password">
              {t("auth.password")}
            </label>
            <input
              id="reg-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <span className="auth-field-error">{t("auth.passwordMin8")}</span>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-confirm-password">
              {t("auth.confirmPassword")}
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            <AnimatePresence>
              {form.formState.errors.confirmPassword && (
                <motion.span
                  className="auth-field-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {t("auth.passwordMismatch")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <button type="submit" className="btn-primary">
            {t("auth.registerCta")}
          </button>
        </form>

        <p className="auth-footer-text">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="auth-link">
            {t("auth.loginLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
