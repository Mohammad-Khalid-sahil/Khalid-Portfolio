import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/useUIStore";

const THEMES = [
  { value: "light", label: "theme.light", Icon: FiSun },
  { value: "dark", label: "theme.dark", Icon: FiMoon },
  { value: "system", label: "theme.system", Icon: FiMonitor },
];

export default function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <div className="flex h-9 items-center gap-0.5 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_60%,transparent)] p-[3px] backdrop-blur">
      {THEMES.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={`${t("theme.label")}: ${t(label)}`}
            aria-pressed={active}
            title={`${t("theme.label")}: ${t(label)}`}
            onClick={() => setTheme(value)}
            className={`flex h-[1.85rem] w-[1.85rem] items-center justify-center rounded-[0.6rem] transition-all duration-300 ${active ? "bg-[var(--color-primary)] text-white shadow-[0_6px_16px_-6px_var(--ds-glow)] hover:bg-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"}`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
