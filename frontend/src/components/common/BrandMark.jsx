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
        <svg aria-hidden="true" viewBox="0 0 48 48" className="brand-mark-art relative h-full w-full" fill="none">
          <rect x="1.5" y="1.5" width="45" height="45" rx="13" stroke="white" strokeOpacity=".28" />
          <path d="M11 16.5 6.5 24l4.5 7.5M37 16.5l4.5 7.5-4.5 7.5" stroke="white" strokeOpacity=".76" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <g className="brand-mark-orbit">
            <ellipse cx="24" cy="24" rx="18" ry="8.5" transform="rotate(-38 24 24)" stroke="white" strokeOpacity=".52" strokeWidth=".8" />
            <circle cx="40" cy="16.5" r="2.1" fill="white" />
          </g>
          <circle className="brand-mark-core" cx="24" cy="24" r="13" fill="white" fillOpacity=".12" />
          <text x="24" y="28.1" textAnchor="middle" fill="white" fontFamily="var(--font-mono), monospace" fontSize="11" fontWeight="700" letterSpacing="-.7">{initials}</text>
          <path className="brand-mark-glint" d="M15 8 29 8 18 40 4 40Z" fill="white" fillOpacity=".25" />
        </svg>
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
