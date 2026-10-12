import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiCode, FiDatabase, FiGlobe, FiLayers, FiServer, FiSmartphone, FiTool } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useSkills } from "@/hooks/queries/useSkills";
import { groupSkillsByCategory } from "@/utils/skillGrouping";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import SpotlightCard from "@/components/ui/SpotlightCard";
import TechIcon from "@/components/ui/TechIcon";
import { rise, stagger } from "@/components/ui/Reveal";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

const CATEGORY_ICONS = {
  frontend: FiGlobe,
  backend: FiServer,
  database: FiDatabase,
  mobile: FiSmartphone,
  devops: FiTool,
  tools: FiLayers,
  other: FiCode,
};

const CATEGORY_TONES = {
  frontend: "--color-primary", backend: "--color-secondary", database: "--color-accent", mobile: "--color-primary",
  devops: "--color-secondary", tools: "--color-secondary", other: "--color-accent",
};

function LevelMeter({ level, tone }) {
  const value = Math.max(0, Math.min(100, Number(level) || 0));
  const filled = Math.round(value / 20);
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((segment) => (
        <span
          key={segment}
          className="h-1.5 w-3 rounded-full transition-colors duration-500"
          style={{ background: segment < filled ? `var(${tone})` : "var(--color-surface-muted)" }}
        />
      ))}
    </span>
  );
}

export default function SkillsPreview() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data: skills, isLoading, isError, refetch } = useSkills();
  const categories = groupSkillsByCategory(skills, (key) => t(`categories.${key === "devops" ? "tools" : key}`));

  return (
    <section id="skills" className="ds-section overflow-hidden">
      <div aria-hidden="true" className="ds-dots pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="02" eyebrow={t("sections.skills.eyebrow")} title={t("sections.skills.title")} description={t("sections.skills.description")} maxWidth="max-w-3xl" />
          <Button href="/skills" variant="outline" className="shrink-0 self-start lg:self-auto">{t("sections.skills.viewAll")} <FiArrowRight className="rtl-flip" /></Button>
        </div>

        {isLoading && <div className="mt-12"><SectionLoader label={t("pages.skills.loading")} /></div>}
        {isError && <div className="mt-12"><ErrorState message={t("pages.skills.error")} onRetry={refetch} /></div>}

        {!isLoading && !isError && categories.length > 0 && (
          <motion.div
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.08 }}
            variants={stagger(0, 0.08)}
            className="mt-14 grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3"
          >
            {categories.map((category, index) => {
              const Icon = CATEGORY_ICONS[category.id] || FiCode;
              const tone = CATEGORY_TONES[category.id] || "--color-primary";
              const wide = index === 0 && categories.length > 2 && category.skills.length > 3;
              return (
                <motion.div key={category.id} variants={rise} className={wide ? "md:col-span-2 xl:col-span-2" : ""}>
                  <SpotlightCard className="flex h-full flex-col p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-border)]" style={{ color: `var(${tone})`, background: `color-mix(in srgb, var(${tone}) 10%, transparent)` }}>
                          <Icon size={19} />
                        </span>
                        <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">{category.label}</h3>
                      </div>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]" dir="ltr">{String(category.skills.length).padStart(2, "0")}</span>
                    </div>

                    <ul className={`mt-6 grid gap-2.5 ${wide ? "sm:grid-cols-2" : ""}`}>
                      {category.skills.map((skill) => (
                        <li key={skill._id || skill.name} title={skill.description || undefined} className="group/skill flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)] px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))] hover:bg-[var(--color-card-hover)]">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-card)] text-[var(--color-text-muted)] transition-colors duration-300 group-hover/skill:text-[var(--color-text-primary)]">
                            <TechIcon name={skill.name} category={skill.category} size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text-secondary)] group-hover/skill:text-[var(--color-text-primary)]">{skill.name}</span>
                          {Number.isFinite(Number(skill.level)) && (
                            <span className="flex shrink-0 items-center gap-2">
                              <LevelMeter level={skill.level} tone={tone} />
                              <span className="w-8 text-end font-mono text-[0.68rem] text-[var(--color-text-muted)]" dir="ltr">{skill.level}%</span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!isLoading && !isError && categories.length === 0 && <p className="mt-10 text-center text-[var(--color-text-muted)]">{t("pages.skills.empty")}</p>}
      </div>
    </section>
  );
}
