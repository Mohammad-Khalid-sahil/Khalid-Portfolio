import { useQuery } from "@tanstack/react-query";
import { FiBarChart2, FiEye, FiFolder, FiUsers } from "react-icons/fi";
import api from "@/services/api";
import { ErrorState } from "@/components/loaders/ErrorState";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { useTranslation } from "react-i18next";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-text-muted)]">{label}</p>
        <Icon className="text-[var(--color-primary)]" size={16} />
      </div>
      <p className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function metricLabel(item) {
  if (item?.title) return item.title;
  if (typeof item?._id === "string") return item._id;
  if (item?._id?.path) return item._id.path;
  if (item?.path) return item.path;
  if (item?.contentId) return item.contentId;
  return "—";
}

function MetricList({ title, items, emptyText }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h2 className="font-mono text-sm text-[var(--color-primary)]">{title}</h2>
      {items?.length ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={`${metricLabel(item)}-${item.count || item.views}`} className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-[var(--color-text-primary)]">{metricLabel(item)}</span>
              <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">{item.views || item.count || 0}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">{emptyText}</p>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api.get("/analytics/summary").then((res) => res.data),
  });

  if (isLoading) return <SectionLoader label={t("phase4.analytics.loading")} />;
  if (isError) return <ErrorState message={t("phase4.analytics.loadError")} onRetry={refetch} />;

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.analytics.description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiEye} label={t("admin.totalPageViews")} value={data?.totalViews ?? t("phase4.analytics.unavailable")} />
        <StatCard icon={FiUsers} label={t("admin.visitors")} value={data?.visitors ?? t("phase4.analytics.unavailable")} />
        <StatCard icon={FiFolder} label={t("admin.projectViews")} value={data?.projectViews ?? t("phase4.analytics.unavailable")} />
        <StatCard icon={FiBarChart2} label={t("admin.blogViews")} value={data?.blogViews ?? t("phase4.analytics.unavailable")} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MetricList title={t("phase4.analytics.topPages")} items={data?.topPages} emptyText={t("phase4.analytics.noPages")} />
        <MetricList title={t("phase4.analytics.popularContent")} items={data?.popularContent} emptyText={t("phase4.analytics.noContent")} />
        <MetricList title={t("phase4.analytics.sources")} items={data?.sources} emptyText={t("phase4.analytics.noSources")} />
        <MetricList title={t("phase4.analytics.devices")} items={data?.devices} emptyText={t("phase4.analytics.noDevices")} />
        <MetricList title={t("phase4.analytics.browsers")} items={data?.browsers} emptyText={t("phase4.analytics.noBrowsers")} />
        <MetricList title={t("phase4.analytics.countries")} items={data?.countries} emptyText={t("phase4.analytics.countryNote")} />
      </div>
    </div>
  );
}
