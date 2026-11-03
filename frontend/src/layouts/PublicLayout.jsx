import { Outlet, Link } from "react-router-dom";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import CommandPalette from "@/components/common/CommandPalette";
import { usePageAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { FiCommand, FiEye } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useVisitorCount } from "@/hooks/queries/useVisitorCount";

export default function PublicLayout() {
  const { t, i18n } = useTranslation();
  const { data: visitorCount } = useVisitorCount();
  usePageAnalyticsTracking();

  return (
    <div className="public-site-shell flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CommandPalette />
      {typeof visitorCount === "number" && (
        <span
          role="status"
          aria-label={`${t("footer.visitors")}: ${new Intl.NumberFormat(i18n.language).format(visitorCount)}`}
          className="fixed bottom-[4.5rem] end-5 z-40 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-card)]/95 px-3.5 py-2 font-mono text-[11px] font-medium text-[var(--color-text-secondary)] shadow-[0_0_24px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] backdrop-blur"
        >
          <FiEye size={13} className="text-[var(--color-primary)]" aria-hidden="true" />
          <span>{t("footer.visitors")}</span>
          <span className="font-semibold tabular-nums text-[var(--color-primary)]">{new Intl.NumberFormat(i18n.language).format(visitorCount)}</span>
        </span>
      )}
      <Link
        to="/assistant"
        aria-label={t("nav.assistant")}
        className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/50 bg-[var(--color-card)] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-primary)] shadow-[0_0_30px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition-transform hover:scale-[1.02]"
      >
        <FiCommand size={14} />
        AI
      </Link>
    </div>
  );
}
