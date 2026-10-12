import { useForm } from "react-hook-form";
import { FiLock, FiMail, FiAlertTriangle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import AnimatedCodeBackground from "@/components/admin/AnimatedCodeBackground";
import BrandMark from "@/components/common/BrandMark";

export default function AdminLogin() {
  const { t } = useTranslation();
  const { login, isLoggingIn, loginError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit(data) {
    try {
      await login(data);
    } catch {
      // error is already surfaced via loginError + toast; nothing further to do here
    }
  }

  return (
    <div className="admin-login grid min-h-screen place-items-center overflow-hidden bg-[var(--color-background)] px-4">
      <AnimatedCodeBackground />
      <div className="admin-login__overlay" aria-hidden="true" />
      <div className="admin-login__content relative z-10 w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <BrandMark name="SH Software" className="mb-6" />
        <p className="font-mono text-sm text-[var(--color-primary)]">{t("admin.label")}</p>
        <h1 className="mt-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-text-primary)]">
          {t("admin.signIn")}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="admin-form mt-6 space-y-4">
          {loginError && (
            <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
              <FiAlertTriangle className="mt-0.5 shrink-0" size={14} />
              <span>{loginError}</span>
            </div>
          )}
          <div>
            <label htmlFor="admin-email" className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)]">
              <FiMail size={12} /> {t("admin.email")}
            </label>
            <input
              id="admin-email"
              type="email"
              dir="ltr"
              {...register("email", { required: t("validation.emailRequired") })}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "admin-email-error" : undefined}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
            {errors.email && <p id="admin-email-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)]">
              <FiLock size={12} /> {t("admin.password")}
            </label>
            <input
              id="admin-password"
              type="password"
              {...register("password", { required: t("admin.passwordRequired") })}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "admin-password-error" : undefined}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              placeholder="••••••••"
            />
            {errors.password && <p id="admin-password-error" role="alert" className="mt-1 text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 font-mono text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {isLoggingIn ? t("admin.signingIn") : t("admin.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
