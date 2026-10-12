import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiGrid,
  FiFolder,
  FiCode,
  FiBriefcase,
  FiClock,
  FiBookOpen,
  FiAward,
  FiMessageSquare,
  FiFileText,
  FiMail,
  FiSettings,
  FiImage,
  FiLogOut,
  FiExternalLink,
  FiUsers,
  FiBarChart2,
  FiCpu,
  FiTag,
  FiLayers,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { roleCan } from "@/config/rbac";
import { ADMIN_PAGE_TITLE_KEYS } from "@/config/adminPageTitles";
import AdminHeader from "@/components/admin/AdminHeader";
import BrandMark from "@/components/common/BrandMark";

const contentItems = [
  { to: "/admin/resource/projects", icon: FiFolder },
  { to: "/admin/resource/skills", icon: FiCode },
  { to: "/admin/resource/services", icon: FiBriefcase },
  { to: "/admin/resource/experiences", icon: FiClock },
  { to: "/admin/resource/education", icon: FiBookOpen },
  { to: "/admin/resource/certifications", icon: FiAward },
  { to: "/admin/resource/testimonials", icon: FiMessageSquare },
  { to: "/admin/blog", icon: FiFileText },
  { to: "/admin/resource/categories", icon: FiLayers },
  { to: "/admin/resource/tags", icon: FiTag },
  { to: "/admin/media", icon: FiImage },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  const navSections = useMemo(() => {
    const sections = [
      {
        labelKey: "admin.overview",
        items: [{ to: "/admin", icon: FiGrid, end: true }],
      },
      {
        labelKey: "admin.content",
        items: contentItems,
      },
    ];

    const administrationItems = [
      { to: "/admin/users", icon: FiUsers, permission: "users:read" },
      { to: "/admin/analytics", icon: FiBarChart2, permission: "analytics:read" },
      { to: "/admin/ai", icon: FiCpu, permission: "ai:admin" },
    ].filter((item) => roleCan(user?.role, item.permission));

    if (administrationItems.length) sections.push({
      labelKey: "admin.administration",
      items: administrationItems,
    });

    const administrationSettings = [
      { to: "/admin/messages", icon: FiMail, permission: "messages:read" },
      { to: "/admin/settings", icon: FiSettings, permission: "settings:write" },
    ].filter((item) => roleCan(user?.role, item.permission));

    if (administrationSettings.length) sections.push({
      labelKey: "admin.inboxSettings",
      items: administrationSettings,
    });

    return sections;
  }, [user?.role]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event) => {
      setIsMobileViewport(!event.matches);
      if (event.matches) setMobileNavOpen(false);
    };

    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  const sidebarClassName = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 font-mono text-sm transition-colors ${
      isActive
        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
        : "text-[var(--color-text-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]"
    }`;

  const getItemLabel = (item) => item.label ?? t(ADMIN_PAGE_TITLE_KEYS[item.to]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--color-background)]">
      <div aria-hidden="true" className="admin-shell-grid pointer-events-none absolute inset-0" />
      {mobileNavOpen && (
        <button
          type="button"
          aria-label={t("common.toggleMenu")}
          className="fixed inset-x-0 bottom-0 top-16 z-10 bg-black/55 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/5 transition-[transform,width] duration-200 max-md:top-16 md:sticky md:top-3 md:my-3 md:ms-3 md:h-[calc(100vh-1.5rem)] md:shrink-0 md:self-start md:rounded-2xl ${
          mobileNavOpen ? "translate-x-0" : "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full"
        } ${desktopNavCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className={`border-b border-[var(--color-border)] py-5 ${desktopNavCollapsed ? "px-2 text-center md:px-2" : "px-5"}`}>
          <div className={`flex items-center gap-3 overflow-hidden whitespace-nowrap ${desktopNavCollapsed ? "md:justify-center" : ""}`}>
            <BrandMark name="SH Software" showWordmark={!desktopNavCollapsed} />
          </div>
          {user?.name && !desktopNavCollapsed && <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-muted)]">{user.name}</p>}
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label={t("admin.label")}>
          {navSections.map((section) => (
            <div key={section.labelKey}>
              <p className={`px-2 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] ${desktopNavCollapsed ? "md:sr-only" : ""}`}>
                {t(section.labelKey)}
              </p>
              <ul className="mt-2 space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileNavOpen(false)}
                      title={desktopNavCollapsed ? getItemLabel(item) : undefined}
                      className={(args) => `${sidebarClassName(args)} ${desktopNavCollapsed ? "md:justify-center md:px-2" : ""}`}
                    >
                      <item.icon size={15} />
                      <span className={desktopNavCollapsed ? "md:sr-only" : ""}>{getItemLabel(item)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={`border-t border-[var(--color-border)] py-4 ${desktopNavCollapsed ? "px-2" : "px-3"}`}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title={desktopNavCollapsed ? t("common.viewSite") : undefined}
            className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ${desktopNavCollapsed ? "md:justify-center md:px-2" : ""}`}
          >
            <FiExternalLink className="shrink-0" size={15} /> <span className={desktopNavCollapsed ? "md:sr-only" : ""}>{t("common.viewSite")}</span>
          </a>
          <button
            type="button"
            onClick={logout}
            title={desktopNavCollapsed ? t("common.logout") : undefined}
            className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] ${desktopNavCollapsed ? "md:justify-center md:px-2" : ""}`}
          >
            <FiLogOut className="shrink-0" size={15} /> <span className={desktopNavCollapsed ? "md:sr-only" : ""}>{t("common.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <AdminHeader
          mobileNavOpen={mobileNavOpen}
          desktopNavCollapsed={desktopNavCollapsed}
          isMobileViewport={isMobileViewport}
          onToggleNavigation={() => {
            if (window.matchMedia("(min-width: 768px)").matches) {
              setDesktopNavCollapsed((collapsed) => !collapsed);
            } else {
              setMobileNavOpen((open) => !open);
            }
          }}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 md:px-7 md:pb-8 md:pt-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
