import { Link, useLocation } from "react-router-dom";
import { FiMail, FiMenu, FiUser, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminMessages } from "@/hooks/queries/useAdminMessages";
import { getAdminPageTitleKey } from "@/config/adminPageTitles";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

export default function AdminHeader({ mobileNavOpen, desktopNavCollapsed, isMobileViewport, onToggleNavigation }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canReadMessages = can("messages:read");
  const { data: messages } = useAdminMessages(canReadMessages);
  const unreadCount = Array.isArray(messages) ? messages.filter((message) => !message.read).length : 0;
  const userName = user?.name?.trim() || user?.email || "";
  const roleLabel = user?.role === "admin"
    ? t("phase4.users.admin")
    : user?.role === "editor"
      ? t("phase4.users.editor")
      : user?.role || "";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur-xl md:border-0 md:bg-transparent md:px-4 md:pt-3">
      <div className="flex min-h-16 items-center justify-between gap-3 border-[var(--color-border)] bg-[var(--color-surface-header)] px-4 py-2 shadow-[var(--shadow-admin-header)] sm:px-6 md:rounded-2xl md:border md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={t((isMobileViewport ? mobileNavOpen : !desktopNavCollapsed) ? "admin.closeNavigation" : "admin.openNavigation")}
            aria-controls="admin-sidebar"
            aria-expanded={isMobileViewport ? mobileNavOpen : !desktopNavCollapsed}
            onClick={onToggleNavigation}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            {(isMobileViewport ? mobileNavOpen : !desktopNavCollapsed) ? <FiX aria-hidden="true" size={17} /> : <FiMenu aria-hidden="true" size={17} />}
          </button>
          <div className="min-w-0" aria-current="page">
            <h1 data-page-title className="truncate font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
              {t(getAdminPageTitleKey(pathname))}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {canReadMessages && (
            <Link
              to="/admin/messages"
              aria-label={unreadCount ? `${t("admin.messages")}: ${unreadCount} ${t("admin.unreadMessages")}` : t("admin.messages")}
              title={t("admin.messages")}
              className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <FiMail aria-hidden="true" size={16} />
              {unreadCount > 0 && (
                <span aria-hidden="true" className="absolute -end-1 -top-1 min-w-4 rounded-full bg-[var(--color-danger)] px-1 text-center font-mono text-[9px] leading-4 text-[var(--color-text-inverse)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <LanguageSwitcher />
          <ThemeToggle />

          <div
            className="flex min-w-0 items-center gap-2 ps-1 sm:ps-2"
            role="group"
            aria-label={[userName, roleLabel].filter(Boolean).join(", ") || undefined}
            title={[userName, roleLabel].filter(Boolean).join(" · ") || undefined}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] font-mono text-xs font-semibold text-[var(--color-primary)]">
              {getInitials(userName) || <FiUser aria-hidden="true" size={15} />}
            </span>
            <span className="hidden min-w-0 sm:block">
              {userName && <span className="block max-w-36 truncate text-xs font-medium text-[var(--color-text-primary)]">{userName}</span>}
              {roleLabel && <span className="block max-w-36 truncate font-mono text-[10px] text-[var(--color-text-muted)]">{roleLabel}</span>}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
