import { initialsFromName } from "@/utils/displayContent";

/**
 * Portfolio brand mark: monogram inside a code-bracket tile + wordmark.
 * Keeps the existing identity (profile name + primary dot) with a more
 * deliberate, developer-oriented treatment.
 */
export default function BrandMark({ name = "Khalid Portfolio", showWordmark = true, size = "md", compact = false, className = "" }) {
  const initials = (name === "Khalid Portfolio" ? "KH" : initialsFromName(name).slice(0, 2)) || "P";
  const firstName = String(name).split(/\s+/)[0] || name;
  const isPortfolioBrand = name === "Khalid Portfolio";
  const tile = size === "lg" ? "h-12 w-12 text-base" : compact ? "h-8 w-8 text-xs xl:h-10 xl:w-10 xl:text-sm" : "h-10 w-10 text-sm";

  return (
    <span className={`group/brand inline-flex min-w-0 items-center ${compact ? "gap-2 xl:gap-3" : "gap-3"} ${className}`}>
      <span className={`relative grid ${tile} shrink-0 place-items-center overflow-hidden rounded-[0.85rem] text-white shadow-[0_10px_30px_-10px_var(--ds-glow)] transition-transform duration-500 group-hover/brand:-rotate-3`}>
        <span aria-hidden="true" className="absolute inset-0 bg-[conic-gradient(from_140deg,var(--color-primary),var(--color-secondary),var(--color-primary))] transition-transform duration-700 group-hover/brand:rotate-180" />
        <span aria-hidden="true" className="absolute inset-[1.5px] rounded-[0.75rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-primary)_42%,#111827),#111222_72%)]" />
        <svg aria-hidden="true" viewBox="0 0 48 48" className="brand-mark-art relative h-full w-full" fill="none">
          <g className="origin-center animate-[spin_18s_linear_infinite] motion-reduce:animate-none" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
            <ellipse cx="24" cy="24" rx="20" ry="14" transform="rotate(-32 24 24)" stroke="white" strokeOpacity=".28" strokeWidth=".8" />
            <circle cx="42.2" cy="16.8" r="1.55" fill="white" />
          </g>
          <path d="M17 8v3m7-3v3m7-3v3M17 37v3m7-3v3m7-3v3M8 17h3m-3 7h3m-3 7h3m26-14h3m-3 7h3m-3 7h3" stroke="white" strokeOpacity=".52" strokeWidth="1.25" strokeLinecap="round" />
          <rect x="11" y="11" width="26" height="26" rx="7" fill="white" fillOpacity=".08" stroke="white" strokeOpacity=".72" strokeWidth="1.1" />
          <path d="m16 19-3 5 3 5m16-10 3 5-3 5" stroke="white" strokeOpacity=".68" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          <text x="24" y="27.7" textAnchor="middle" fill="white" fontFamily="var(--font-mono), monospace" fontSize="10.5" fontWeight="700" letterSpacing="-1">{initials}</text>
        </svg>
      </span>
      {showWordmark && (
        <span dir="ltr" className={`min-w-0 truncate font-[var(--font-display)] font-semibold tracking-tight text-[var(--color-text-primary)] ${compact ? "max-[400px]:max-w-[4.5rem] text-[0.84rem] sm:text-[0.95rem] xl:max-w-none xl:text-[1.05rem]" : "text-[1.05rem]"}`}>
          {isPortfolioBrand ? (
            <><span>Khalid</span><span className="ms-1 text-[var(--color-primary)]">Portfolio</span></>
          ) : (
            <>{firstName}<span className="text-[var(--color-primary)]">.</span><span className="ms-1 hidden font-mono text-[0.7rem] font-normal text-[var(--color-text-muted)] 2xl:inline">dev</span></>
          )}
        </span>
      )}
    </span>
  );
}
