import { useQuery } from "@tanstack/react-query";
import { FiCpu, FiShield, FiActivity } from "react-icons/fi";
import api from "@/services/api";
import { ErrorState } from "@/components/loaders/ErrorState";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { useTranslation } from "react-i18next";

export default function AdminAI() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "ai-status"],
    queryFn: async () => {
      const response = await api.get("/ai/status");
      return {
        status: response?.data?.status ?? "not_configured",
        message: response?.message ?? t("phase4.ai.unavailable"),
      };
    },
  });

  if (isLoading) return <SectionLoader label={t("phase4.ai.loading")} />;
  if (isError) return <ErrorState message={t("phase4.ai.loadError")} onRetry={refetch} />;

  const status = data?.status ?? "not_configured";
  const message = data?.message ?? t("phase4.ai.unavailable");

  const statusTone = {
    available: "text-[var(--color-success)] border-[var(--color-success)]/50 bg-[var(--color-success)]/10",
    unavailable: "text-[var(--color-warning)] border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10",
    not_configured: "text-[var(--color-text-muted)] border-[var(--color-border)] bg-[var(--color-card)]",
  }[status] || "text-[var(--color-text-muted)] border-[var(--color-border)] bg-[var(--color-card)]";

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.ai.description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.ai.provider")}</p>
            <FiCpu className="text-[var(--color-primary)]" size={16} />
          </div>
          <div className={`mt-4 inline-flex rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider ${statusTone}`}>
            {t(`phase4.ai.status.${status}`, { defaultValue: status })}
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-primary)]">{message}</p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.ai.secrets")}</p>
            <FiShield className="text-[var(--color-primary)]" size={16} />
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-primary)]">{t("phase4.ai.noSecrets")}</p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{t("phase4.ai.operational")}</p>
            <FiActivity className="text-[var(--color-primary)]" size={16} />
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-primary)]">
            {status === "available"
              ? t("phase4.ai.available")
              : status === "unavailable"
                ? t("phase4.ai.configuredDown")
                : t("phase4.ai.notConfigured")}
          </p>
        </div>
      </div>
    </div>
  );
}
