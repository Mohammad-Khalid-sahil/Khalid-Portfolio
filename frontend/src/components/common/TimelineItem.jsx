import { motion } from "framer-motion";
import { formatLocaleDate } from "@/utils/formatDate";

export default function TimelineItem({ title, subtitle, meta, period, children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="relative border-s border-[var(--color-border)] ps-7 pb-10 last:pb-0 sm:ps-9"
    >
      <span className="absolute -start-[6px] top-7 h-3 w-3 rounded-full border-[3px] border-[var(--color-surface)] bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" />
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-lg sm:p-6">
      <p className="inline-flex rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-mono text-xs text-[var(--color-primary)]">{period}</p>
      <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm font-medium text-[var(--color-secondary)]">
          {subtitle} {meta && `· ${meta}`}
        </p>
      )}
      <div className="mt-3 leading-relaxed text-[var(--color-text-muted)]">{children}</div>
      </article>
    </motion.div>
  );
}

export function formatDate(dateStr) {
  return formatLocaleDate(dateStr);
}
