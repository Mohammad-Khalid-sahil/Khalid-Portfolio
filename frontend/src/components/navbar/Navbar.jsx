import { useEffect, useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { NavLink, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { FiMenu, FiX, FiCommand, FiLock, FiArrowUpRight, FiDownload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { navLinks } from "@/constants/siteData";
import { useUIStore } from "@/store/useUIStore";
import { useProfile } from "@/hooks/queries/useProfile";
import { useActiveSection } from "@/hooks/useActiveSection";
import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import BrandMark from "@/components/common/BrandMark";
import Button from "@/components/ui/Button";

const sectionIdFor = (to) => (to === "/" ? "home" : to.slice(1));
const SECTION_IDS = navLinks.map((link) => sectionIdFor(link.to));

export default function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const { data: profile } = useProfile();
  const brandName = "SH Software";
  const resumeUrl = profile?.resumeUrl || DEFAULT_RESUME_URL;
  const isHome = pathname === "/";
  const activeSection = useActiveSection(SECTION_IDS, isHome);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  function navigateToSection(event, to) {
    if (pathname !== "/") return;
    const section = document.getElementById(sectionIdFor(to));
    if (!section) return;
    event.preventDefault();
    closeMobileMenu();
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function isLinkActive(link, routerActive) {
    if (isHome && activeSection) return sectionIdFor(link.to) === activeSection;
    return link.to === "/" ? pathname === "/" : routerActive;
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on route changes and lock body scroll while open.
  useEffect(() => { closeMobileMenu(); }, [pathname, closeMobileMenu]);
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => { if (event.key === "Escape") closeMobileMenu(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  const iconButton = "grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <motion.nav
          initial={reduce ? false : { y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-label={t("footer.navigation")}
          className={`relative mx-auto w-full max-w-[78rem] rounded-[1.25rem] border transition-[background-color,border-color,box-shadow,padding] duration-500 ${
            scrolled
              ? "ds-glass border-[var(--ds-hairline)] px-3 py-2 shadow-[0_20px_50px_-28px_rgb(0_0_0/0.6)] sm:px-4"
              : "border-transparent bg-transparent px-3 py-3 sm:px-4"
          }`}
        >
          <div className="flex h-11 items-center justify-between gap-3">
            <NavLink to="/" onClick={(event) => navigateToSection(event, "/")} aria-label={brandName} className="min-w-0 text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]">
              <BrandMark name={brandName} />
            </NavLink>

            <ul className="hidden items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_55%,transparent)] p-1 xl:flex">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={(event) => navigateToSection(event, link.to)}
                    className="relative block rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium"
                  >
                    {({ isActive }) => {
                      const active = isLinkActive(link, isActive);
                      return (
                        <>
                          {active && (
                            <motion.span
                              layoutId="nav-active-pill"
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                              className="absolute inset-0 rounded-full bg-[var(--color-primary)]/12 ring-1 ring-[var(--color-primary)]/30"
                            />
                          )}
                          <span className={`relative transition-colors duration-200 ${active ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
                            {t(link.labelKey)}
                          </span>
                        </>
                      );
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="hidden items-center gap-2 xl:flex">
              <button
                type="button"
                onClick={openCommandPalette}
                aria-label={t("common.searchWithShortcut")}
                title={t("common.searchWithShortcut")}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-transparent px-2.5 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <FiCommand size={13} />
                <span className="ds-kbd">K</span>
              </button>
              <LanguageSwitcher />
              <ThemeToggle />
              {resumeUrl && (
                <Button href={resumeUrl} download size="sm" className="ms-1">
                  {t("nav.resume")} <FiArrowUpRight className="rtl-flip" size={14} />
                </Button>
              )}
            </div>

            <button
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_70%,transparent)] text-[var(--color-text-primary)] transition-colors xl:hidden"
              aria-label={t("common.toggleMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={toggleMobileMenu}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? "close" : "open"}
                  initial={reduce ? false : { rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={reduce ? undefined : { rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          <motion.span
            aria-hidden="true"
            style={{ scaleX: progress }}
            className={`ds-progress absolute inset-x-4 bottom-0 h-px transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
          />
        </motion.nav>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 xl:hidden"
          >
            <button type="button" aria-label={t("ui.close")} onClick={closeMobileMenu} className="absolute inset-0 h-full w-full cursor-default bg-[color-mix(in_srgb,var(--color-background)_70%,transparent)] backdrop-blur-md hover:bg-[color-mix(in_srgb,var(--color-background)_70%,transparent)]" />
            <motion.div
              id="mobile-navigation"
              initial={reduce ? false : { y: -16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { y: -10, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="ds-glass absolute inset-x-3 top-[5.25rem] max-h-[calc(100svh-6.5rem)] overflow-y-auto rounded-[1.5rem] p-3 shadow-[var(--ds-shadow-lg)] sm:inset-x-6"
            >
              <p className="px-3 pb-2 pt-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{t("ui.menu")}</p>
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.035 } } }}
                className="grid gap-1 sm:grid-cols-2"
              >
                {navLinks.map((link, index) => (
                  <motion.li key={link.to} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                    <NavLink
                      to={link.to}
                      onClick={(event) => {
                        navigateToSection(event, link.to);
                        closeMobileMenu();
                      }}
                      className={({ isActive }) => {
                        const active = isLinkActive(link, isActive);
                        return `group flex items-center justify-between rounded-2xl px-4 py-3.5 text-[0.95rem] font-medium transition-colors ${
                          active ? "bg-[var(--color-primary)]/12 text-[var(--color-text-primary)] ring-1 ring-[var(--color-primary)]/25" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)]"
                        }`;
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[0.7rem] text-[var(--color-primary)]" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                        {t(link.labelKey)}
                      </span>
                      <FiArrowUpRight className="rtl-flip text-[var(--color-text-muted)] transition-transform group-hover:-translate-y-0.5" size={15} />
                    </NavLink>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-2 pt-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <button type="button" onClick={() => { closeMobileMenu(); openCommandPalette(); }} aria-label={t("common.searchWithShortcut")} className={iconButton}>
                  <FiCommand size={15} />
                </button>
                {resumeUrl && (
                  <Button href={resumeUrl} download size="sm" className="ms-auto">
                    <FiDownload size={14} /> {t("nav.resume")}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div aria-hidden="true" className="h-[76px] shrink-0 sm:h-[84px]" />
    </>
  );
}
