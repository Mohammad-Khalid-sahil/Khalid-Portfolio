import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/useUIStore";
import { useProfile } from "@/hooks/queries/useProfile";

export default function CommandPalette() {
  const { t } = useTranslation();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const toggle = useUIStore((s) => s.toggleCommandPalette);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const closeAndReset = () => {
    setQuery("");
    close();
  };

  const commands = useMemo(
    () => [
      { id: "home", label: t("commands.goTo", { page: t("nav.home") }), action: () => navigate("/") },
      { id: "about", label: t("commands.goTo", { page: t("nav.about") }), action: () => navigate("/about") },
      { id: "skills", label: t("commands.goTo", { page: t("nav.skills") }), action: () => navigate("/skills") },
      { id: "services", label: t("commands.goTo", { page: t("nav.services") }), action: () => navigate("/services") },
      { id: "projects", label: t("commands.goTo", { page: t("nav.projects") }), action: () => navigate("/projects") },
      { id: "experience", label: t("commands.goTo", { page: t("nav.experience") }), action: () => navigate("/experience") },
      { id: "education", label: t("commands.goTo", { page: t("nav.education") }), action: () => navigate("/education") },
      { id: "certifications", label: t("commands.goTo", { page: t("nav.certifications") }), action: () => navigate("/certifications") },
      { id: "testimonials", label: t("commands.goTo", { page: t("nav.testimonials") }), action: () => navigate("/testimonials") },
      { id: "resume", label: t("commands.goTo", { page: t("nav.resume") }), action: () => navigate("/resume") },
      { id: "blog", label: t("commands.goTo", { page: t("nav.blog") }), action: () => navigate("/blog") },
      { id: "contact", label: t("commands.goTo", { page: t("nav.contact") }), action: () => navigate("/contact") },
      { id: "cv", label: t("commands.downloadCv"), action: () => window.open(profile?.resumeUrl || DEFAULT_RESUME_URL, "_blank", "noopener,noreferrer") },
      { id: "theme", label: t("commands.toggleTheme"), action: toggleTheme },
      { id: "admin", label: t("common.adminLogin"), action: () => navigate("/admin/login") },
    ],
    [navigate, toggleTheme, profile, t]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeAndReset();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll(focusableSelector)].filter(
          (element) => !element.hasAttribute("disabled") && element.offsetParent !== null
        );

        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    requestAnimationFrame(() => inputRef.current?.focus());
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAndReset, open, toggle]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[15vh]"
          onClick={closeAndReset}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.searchWithShortcut")}
            className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <FiSearch className="text-[var(--color-text-muted)]" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.searchWithShortcut")}
                aria-label={t("common.searchWithShortcut")}
                className="w-full bg-transparent font-mono text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
            </div>
            <ul className="max-h-72 overflow-y-auto py-2" aria-label={t("common.searchWithShortcut")}>
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{t("common.noResults")}</li>
              )}
              {filtered.map((cmd) => (
                <li key={cmd.id}>
                  <button
                    type="button"
                    onClick={() => {
                      cmd.action();
                      closeAndReset();
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-start text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                  >
                    {cmd.label}
                    <FiArrowRight size={14} className="rtl-flip opacity-60" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
