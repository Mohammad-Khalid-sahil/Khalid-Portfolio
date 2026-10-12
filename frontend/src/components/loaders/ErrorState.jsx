import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "react-i18next";

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div role="alert" aria-live="assertive" className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-warning)]/20 bg-[var(--color-card)] p-8 text-center shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-warning)]/10"><FiAlertTriangle aria-hidden="true" className="text-[var(--color-warning)]" size={19} /></span>
      <p className="max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">{message || t("common.loadError")}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
        >
          <FiRefreshCw size={12} /> {t("common.tryAgain")}
        </button>
      )}
    </div>
  );
}
