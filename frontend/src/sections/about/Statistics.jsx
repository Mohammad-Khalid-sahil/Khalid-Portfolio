import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/queries/useProfile";
import { motion, useReducedMotion } from "framer-motion";
import { FiBriefcase, FiCode, FiLayers, FiUsers } from "react-icons/fi";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import { useCountUp } from "@/hooks/useCountUp";

const STAT_ICONS = [FiBriefcase, FiCode, FiLayers, FiUsers];

function StatItem({ value, suffix, label, index }) {
  const Icon = STAT_ICONS[index % STAT_ICONS.length];
  const numeric = Number(value);
  const isNumeric = Number.isFinite(numeric);
  const { ref, value: counted } = useCountUp(isNumeric ? numeric : 0, { duration: 1400 });

  return (
    <div className="group relative flex flex-col gap-4 p-6 sm:p-7">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-[var(--color-primary)]/40 group-hover:shadow-[0_10px_24px_-12px_var(--ds-glow)]"><Icon size={17} /></span>
      <p ref={ref} className="ds-display text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl" dir="ltr">
        <span className="tabular-nums">{isNumeric ? counted : value}</span>
        <span className="text-[var(--color-primary)]">{suffix}</span>
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export default function Statistics({ embedded = false }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  return (
    <section id="home-stats" className={embedded ? "container-page mt-5" : "container-page py-2"}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="ds-card grid grid-cols-2 overflow-hidden lg:grid-cols-4"
      >
        {isLoading && <div className="col-span-full"><SectionLoader label={t("common.loading")} /></div>}
        {isError && <div className="col-span-full p-6"><ErrorState message={t("pages.about.error")} onRetry={refetch} /></div>}
        {!isLoading && !isError && !profile?.stats?.length && (
          <p className="col-span-full p-6 text-center text-sm text-[var(--color-text-muted)]">{t("phase4.misc.statsEmpty")}</p>
        )}
        {!isLoading && !isError && profile?.stats?.map((stat, index) => (
          <div key={stat._id || stat.label} className={`relative ${index % 2 === 1 ? "border-s border-[var(--color-border)]" : ""} ${index > 1 ? "border-t border-[var(--color-border)] lg:border-t-0" : ""} ${index > 0 ? "lg:border-s lg:border-[var(--color-border)]" : ""}`}>
            <StatItem value={stat.value} suffix={stat.suffix} label={stat.label} index={index} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
