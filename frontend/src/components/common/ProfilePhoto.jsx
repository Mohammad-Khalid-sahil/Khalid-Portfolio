import { useState } from "react";
import { initialsFromName } from "@/utils/displayContent";

export default function ProfilePhoto({ src, alt, name, className = "" }) {
  const initials = initialsFromName(name);
  const [failedSrc, setFailedSrc] = useState(null);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={alt || name || ""}
        className={`h-full w-full object-cover ${className}`.trim()}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <div
      className={`grid h-full w-full place-items-center font-[var(--font-display)] text-4xl font-semibold text-[var(--color-text-muted)] ${className}`.trim()}
      aria-label={name || alt || undefined}
    >
      {initials}
    </div>
  );
}
