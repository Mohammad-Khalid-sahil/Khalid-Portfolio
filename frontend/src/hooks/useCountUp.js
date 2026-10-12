import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Animates a number from 0 to `target` once the element scrolls into view.
 * Respects prefers-reduced-motion by jumping straight to the target.
 */
export function useCountUp(target, { duration = 1200 } = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    let start = null;
    let frameId;

    function step(timestamp) {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(Math.floor(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(step);
    }

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, target, duration, prefersReducedMotion]);

  return { ref, value };
}
