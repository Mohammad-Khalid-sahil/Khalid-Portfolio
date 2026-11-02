import { motion, useReducedMotion } from "framer-motion";
import { FiCalendar } from "react-icons/fi";

/** The alternating rail used by the Experience page, shared by portfolio lists. */
export default function ExperienceTimeline({ items = [], renderItem, getMeta, className = "" }) {
  const reduceMotion = useReducedMotion();

  if (!items.length) return null;

  return (
    <div className={`relative mx-auto max-w-5xl ${className}`}>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-[11px] top-0 z-[1] w-[2px] bg-gradient-to-b from-transparent via-[var(--color-primary)]/70 to-transparent lg:start-1/2 lg:-translate-x-1/2" />
      <div className="space-y-12 lg:space-y-20">
        {items.map((item, index) => {
          const isLeft = index % 2 === 0;
          return (
            <motion.div
              key={item._id || item.id || item.slug || index}
              initial={reduceMotion ? false : { opacity: 0, y: 22, x: isLeft ? -12 : 12, scale: 0.985 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative lg:grid lg:grid-cols-2 lg:gap-16"
            >
              <span aria-hidden="true" className="absolute start-3 top-8 z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 lg:start-1/2">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>

              <div className={`hidden pt-7 lg:flex ${isLeft ? "lg:col-start-2 lg:justify-start" : "lg:col-start-1 lg:justify-end"}`}>
                <span className="inline-flex h-fit max-w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] shadow-sm">
                  <FiCalendar size={14} className="shrink-0 text-[var(--color-primary)]" />
                  <span className="truncate">{getMeta?.(item, index) || `#${String(index + 1).padStart(2, "0")}`}</span>
                </span>
              </div>

              <div className={`min-w-0 ps-10 lg:row-start-1 lg:ps-0 ${isLeft ? "lg:col-start-1" : "lg:col-start-2"}`}>
                {renderItem(item, index, getMeta?.(item, index))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
