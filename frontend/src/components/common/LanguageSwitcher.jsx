import { useState, useRef, useEffect } from "react";
import { FiGlobe } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/useUIStore";

const LANGUAGES = [
  { code: "en", labelKey: "common.english" },
  { code: "fa", labelKey: "common.dari" },
  { code: "ps", labelKey: "common.pashto" },
];

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("common.changeLanguage")}
        title={t("common.changeLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-transparent px-2.5 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <FiGlobe size={15} />
        <span className="font-mono text-[0.68rem] uppercase" dir="ltr">{language}</span>
      </button>

      {open && (
        <div
          className="absolute end-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-[var(--ds-shadow-lg)]"
          role="listbox"
          aria-label={t("common.changeLanguage")}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              role="option"
              aria-selected={language === lang.code}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-start text-sm transition-colors hover:bg-[var(--color-surface-muted)] ${
                language === lang.code
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {t(lang.labelKey)}
              <span className="font-mono text-[0.65rem] uppercase text-[var(--color-text-muted)]" dir="ltr">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
