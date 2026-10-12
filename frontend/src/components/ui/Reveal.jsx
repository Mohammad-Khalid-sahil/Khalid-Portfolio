import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Scroll-triggered reveal used across the public site. Fades, lifts, and
 * un-blurs content once. Respects prefers-reduced-motion automatically.
 */
export default function Reveal({ as = "div", children, delay = 0, y = 24, blur = true, amount = 0.2, className = "", ...props }) {
  const reduce = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      initial={reduce ? false : { opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : delay, ease: EASE }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Variants for staggered lists: parent uses `stagger`, children use `rise`. */
export const stagger = (delayChildren = 0, staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

export const rise = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};
