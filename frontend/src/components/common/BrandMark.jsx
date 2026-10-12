import { initialsFromName } from "@/utils/displayContent";

/**
 * Portfolio brand mark: monogram inside a code-bracket tile + wordmark.
 * Keeps the existing identity (profile name + primary dot) with a more
 * deliberate, developer-oriented treatment.
 */
export default function BrandMark({ name = "SH Software", showWordmark = true, size = "md", className = "" }) {
  const initials = (name === "SH Software" ? "SH" : initialsFromName(name).slice(0, 2)) || "P";
  const firstName = String(name).split(/\s+/)[0] || name;
  const isSoftwareBrand = name === "SH Software";
  const tile = size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  return (
    <span className={`group/brand inline-flex min-w-0 items-center gap-3 ${className}`}>
      <span className={`relative grid ${tile} shrink-0 place-items-center overflow-hidden rounded-[0.85rem] text-white shadow-[0_10px_30px_-10px_var(--ds-glow)]`}>
        <span aria-hidden="true" className="absolute inset-0 bg-[conic-gradient(from_140deg,var(--color-primary),var(--color-secondary),var(--color-primary))] transition-transform duration-700 group-hover/brand:rotate-180" />
        <span aria-hidden="true" className="absolute inset-[1.5px] rounded-[0.75rem] bg-[color-mix(in_srgb,var(--color-primary)_78%,#0b0b1a)]" />
        <span className="relative flex items-center font-mono font-semibold tracking-tight" dir="ltr">
          <span className="opacity-60">&lt;</span>
          {initials}
          <span className="opacity-60">/&gt;</span>
        </span>
      </span>
      {showWordmark && (
        <span dir="ltr" className="min-w-0 truncate font-[var(--font-display)] text-[1.05rem] font-semibold tracking-tight text-[var(--color-text-primary)]">
          {isSoftwareBrand ? (
            <><span>SH</span><span className="ms-1 text-[var(--color-primary)]">Software</span></>
          ) : (
            <>{firstName}<span className="text-[var(--color-primary)]">.</span><span className="ms-1 hidden font-mono text-[0.7rem] font-normal text-[var(--color-text-muted)] 2xl:inline">dev</span></>
          )}
        </span>
      )}
    </span>
  );
}
