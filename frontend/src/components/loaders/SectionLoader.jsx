import { useTranslation } from "react-i18next";

export function SectionLoader({ label }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex min-h-[200px] items-center justify-center">
      <div className="flex min-w-56 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 text-sm text-[var(--color-text-muted)] shadow-sm">
        <span aria-hidden="true" className="relative grid h-5 w-5 shrink-0 place-items-center">
          <span className="absolute h-full w-full animate-ping rounded-full bg-[var(--color-primary)]/20" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
        </span>
        <span>{label || t("common.loading")}</span>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
      <div className="aspect-video bg-[var(--color-surface)]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-[var(--color-surface)]" />
        <div className="h-3 w-full rounded bg-[var(--color-surface)]" />
        <div className="h-3 w-4/5 rounded bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}
