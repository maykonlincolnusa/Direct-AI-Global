import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth";
import { Languages } from "lucide-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginValues = z.infer<typeof loginSchema>;

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

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  function onSubmit(data: LoginValues) {
    setError("");
    // Simulação de login — substituir por chamada real à API
    if (data.email && data.password.length >= 6) {
      const name = data.email.split("@")[0];
      login({
        id: "usr_" + Math.random().toString(36).slice(2),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: data.email,
        plan: "starter",
        avatarInitials: name.slice(0, 2).toUpperCase()
      });
      navigate("/");
    } else {
      setError(t("auth.invalidCredentials"));
    }
  }

  return (
    <div className="auth-shell">
      <div className="background-orb background-orb-a" />
      <div className="background-orb background-orb-b" />

      <header className="auth-lang-bar">
        <label className="stat-chip stat-chip-language" htmlFor="auth-language">
          <Languages size={14} />
          <select
            id="auth-language"
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

        <h1 className="auth-title">{t("auth.loginTitle")}</h1>
        <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form" noValidate>
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="login-email">
              {t("auth.email")}
            </label>
            <input
              id="login-email"
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
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="login-password">
                {t("auth.password")}
              </label>
              <button type="button" className="auth-link-small">
                {t("auth.forgotPassword")}
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <span className="auth-field-error">{t("auth.passwordMin")}</span>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-error-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="btn-primary"
            disabled={form.formState.isSubmitting}
          >
            {t("auth.loginCta")}
          </button>
        </form>

        <p className="auth-footer-text">
          {t("auth.noAccount")}{" "}
          <Link to="/cadastro" className="auth-link">
            {t("auth.register")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
