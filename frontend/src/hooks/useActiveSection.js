import { useEffect, useState } from "react";

/**
 * Tracks which home-page section is currently in view so the navigation can
 * highlight it. Returns null when none of the ids exist (e.g. on sub pages).
 */
export function useActiveSection(ids = [], enabled = true) {
  const [active, setActive] = useState(null);
  const key = ids.join("|");

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") {
      setActive(null);
      return undefined;
    }
    const elements = key.split("|").map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return undefined;

    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });
      const ordered = elements.map((el) => el.id).filter((id) => visible.has(id));
      if (ordered.length) setActive(ordered[0]);
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01, 0.25] });

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key, enabled]);

  return active;
}
