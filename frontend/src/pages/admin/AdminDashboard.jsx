import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiUsers, FiFolder, FiMail, FiEye, FiArrowRight, FiMonitor, FiGithub } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminMessages } from "@/hooks/queries/useAdminMessages";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

function useAnalyticsSummary(enabled) {
  return useQuery({
    queryKey: ["admin", "analytics-summary"],
    queryFn: () => api.get("/analytics/summary").then((res) => res.data),
    enabled,
  });
}

function useProjectsCount() {
  return useQuery({
    queryKey: ["admin", "projects-count"],
    queryFn: () => api.get("/projects").then((res) => res.data),
  });
}

function StatCard({ icon: Icon, label, value, tone = "green" }) {
  return (
    <div data-stat-tone={tone} className="dashboard-stat-card group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--stat-accent)]/10"><Icon className="dashboard-stat-icon" size={18} /></span>
      </div>
      <p className="mt-5 font-[var(--font-display)] text-3xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function MetricList({ title, items, empty, getLabel = (item) => item._id || "—" }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-[var(--color-primary)]">{title}</h2>
      </div>
      {items?.length ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={`${getLabel(item)}-${item.count || item.views}`}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="truncate text-[var(--color-text-primary)]">{getLabel(item)}</span>
              <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">{item.views || item.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">{empty}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canViewAnalytics = can("analytics:read");
  const canViewMessages = can("messages:read");
  const { data: analytics, isLoading: loadingAnalytics, isError: errorAnalytics, refetch } = useAnalyticsSummary(canViewAnalytics);
  const { data: messages, isLoading: loadingMessages } = useAdminMessages(canViewMessages);
  const { data: projects, isLoading: loadingProjects } = useProjectsCount();

  const unreadCount = messages?.filter((m) => !m.read).length ?? 0;
  const topDevice = [...(analytics?.devices || [])].sort((a, b) => b.count - a.count)[0]?._id || "unknown";

  return (
    <div>
      <p className="text-sm text-[var(--color-text-muted)]">{t("admin.dashboardSubtitle")}</p>

      {canViewAnalytics && errorAnalytics && (
        <div className="mt-6">
          <ErrorState message={t("admin.couldntLoadAnalytics")} onRetry={refetch} />
        </div>
      )}

      {canViewAnalytics && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard tone="teal" icon={FiEye} label={t("admin.totalPageViews")} value={loadingAnalytics ? "..." : analytics?.totalViews ?? 0} />
          <StatCard tone="sage" icon={FiUsers} label={t("admin.visitors")} value={loadingAnalytics ? "..." : analytics?.visitors ?? 0} />
          <StatCard tone="green" icon={FiFolder} label={t("admin.projectViews")} value={loadingAnalytics ? "..." : analytics?.projectViews ?? 0} />
          <StatCard tone="lime" icon={FiGithub} label={t("admin.blogViews")} value={loadingAnalytics ? "..." : analytics?.blogViews ?? 0} />
        </div>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${canViewAnalytics ? "mt-4" : "mt-6"}`}>
        <StatCard tone="green" icon={FiFolder} label={t("admin.projects")} value={loadingProjects ? "..." : projects?.length ?? 0} />
        {canViewMessages && (
          <>
            <StatCard tone="teal" icon={FiMail} label={t("admin.messages")} value={loadingMessages ? "..." : messages?.length ?? 0} />
            <StatCard tone="sage" icon={FiUsers} label={t("admin.unreadMessages")} value={loadingMessages ? "..." : unreadCount} />
          </>
        )}
        {canViewAnalytics && (
          <StatCard tone="neutral" icon={FiMonitor} label={t("admin.topDevice")} value={loadingAnalytics ? "..." : topDevice} />
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {canViewAnalytics && (
          <>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-sm text-[var(--color-primary)]">{t("admin.topPages")}</h2>
              </div>
              {loadingAnalytics ? (
                <SectionLoader label={t("common.loading")} />
              ) : analytics?.topPages?.length ? (
                <ul className="mt-4 space-y-2">
                  {analytics.topPages.map((page) => (
                    <li key={page._id} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-[var(--color-text-primary)]">{page._id}</span>
                      <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">{t("admin.viewsCount", { count: page.views })}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">{t("admin.noAnalyticsData")}</p>
              )}
            </div>

            <MetricList
              title={t("admin.popularContent")}
              items={analytics?.popularContent}
              empty={t("admin.noAnalyticsData")}
              getLabel={(item) => item.title || item._id?.path || "—"}
            />

            <MetricList title={t("admin.trafficSources")} items={analytics?.sources} empty={t("admin.noAnalyticsData")} />
            <MetricList title={t("admin.devices")} items={analytics?.devices} empty={t("admin.noAnalyticsData")} />
            <MetricList title={t("admin.browsers")} items={analytics?.browsers} empty={t("admin.noAnalyticsData")} />
            <MetricList
              title={t("admin.countries")}
              items={analytics?.countries}
              empty={t("admin.countryDataNote")}
            />
          </>
        )}

        {canViewMessages && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm text-[var(--color-primary)]">{t("admin.recentMessages")}</h2>
              <Link
                to="/admin/messages"
                className="flex items-center gap-1 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                {t("admin.viewAll")} <FiArrowRight className="rtl-flip" size={11} />
              </Link>
            </div>
            {loadingMessages ? (
              <SectionLoader label={t("common.loading")} />
            ) : messages?.length ? (
              <ul className="mt-4 space-y-3">
                {messages.slice(0, 5).map((msg) => (
                  <li key={msg._id} className="border-b border-[var(--color-border)] pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--color-text-primary)]">{msg.name}</p>
                      {!msg.read && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                    </div>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">{msg.subject}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">{t("admin.noMessagesYet")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
