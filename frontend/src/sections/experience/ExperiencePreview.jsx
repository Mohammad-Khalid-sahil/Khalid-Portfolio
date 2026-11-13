import { useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiCode, FiDownload, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useExperiences } from "@/hooks/queries/useCareer";
import { useProfile } from "@/hooks/queries/useProfile";
import { formatDate } from "@/components/common/TimelineItem";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import ExperienceTimeline from "@/components/common/ExperienceTimeline";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import TechIcon from "@/components/ui/TechIcon";

export default function ExperiencePreview() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: experiences, isLoading, isError, refetch } = useExperiences();
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState("all");
  const filteredExperiences = (experiences || []).filter((experience) => (
    filter === "all" || Boolean(experience.isCurrent) === (filter === "current")
  ));
  const items = filteredExperiences.slice(0, 4);
  const resumeUrl = profile?.resumeUrl || DEFAULT_RESUME_URL;

  function renderExperienceCard(experience) {
    const technologies = experience.technologies?.slice(0, 4) || [];

    return (
      <article className="ds-card ds-experience-card group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl p-0">
        <header className="flex items-start gap-4 border-b border-[var(--color-border)] p-5 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-5deg]">
            <FiBriefcase size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words font-[var(--font-display)] text-lg font-bold text-[var(--color-text-primary)] sm:text-xl">
                {experience.position}
              </h3>
              {experience.isCurrent && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-secondary)]">
                  <FiStar size={11} className="fill-current" />
                  {t("pages.experience.current")}
                </span>
              )}
            </div>
            <p className="mt-1 font-semibold text-[var(--color-primary)]">{experience.company}</p>
            {experience.location && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{experience.location}</p>}
            <p className="mt-2 text-xs font-medium text-[var(--color-text-muted)] lg:hidden">
              {formatDate(experience.startDate)} — {experience.isCurrent ? t("pages.experience.present") : formatDate(experience.endDate)}
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {experience.description && <p className="line-clamp-3 text-sm leading-7 text-[var(--color-text-muted)]">{experience.description}</p>}

          {experience.responsibilities?.length > 0 && (
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <FiCode size={15} className="text-[var(--color-primary)]" />{t("common.responsibilities")}
              </h4>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
                {experience.responsibilities.slice(0, 2).map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {experience.achievements?.length > 0 && (
            <div className="mt-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                <FiCheckCircle size={15} className="text-[var(--color-secondary)]" />{t("adminValidation.fields.achievements")}
              </h4>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">{experience.achievements[0]}</p>
            </div>
          )}

          {technologies.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
              {technologies.map((technology) => (
                <span key={technology} className="ds-chip inline-flex items-center gap-1.5">
                  <TechIcon name={technology} size={14} />{technology}
                </span>
              ))}
              {experience.technologies.length > technologies.length && <span className="ds-chip">+{experience.technologies.length - technologies.length}</span>}
            </div>
          )}

          <Link to="/projects" className="group/link mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[var(--color-primary)]">
            {t("nav.projects")}<FiArrowRight className="rtl-flip transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </div>
      </article>
    );
  }

  return (
    <section id="experience" className="ds-section scroll-mt-20 overflow-hidden bg-[var(--color-surface)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute start-0 top-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute end-0 bottom-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="05" eyebrow={t("pages.experience.eyebrow")} title={t("pages.experience.heroTitle")} description={t("pages.experience.heroDescription")} maxWidth="max-w-3xl" />
          <Button href="/experience" variant="outline" className="shrink-0 self-start lg:self-auto">{t("pages.experience.title")} <FiArrowRight className="rtl-flip" /></Button>
        </div>

        {!isLoading && !isError && (experiences || []).length > 0 && (
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 15 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
          >
            {[["all", t("categories.all")], ["current", t("pages.experience.present")], ["previous", t("common.previous")]].map(([value, label]) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${filter === value ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg shadow-[var(--color-primary)]/20" : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"}`}
              >{label}</motion.button>
            ))}
          </motion.div>
        )}

        {isLoading && <div className="mt-12"><SectionLoader label={t("pages.experience.loading")} /></div>}
        {isError && <div className="mt-12"><ErrorState message={t("pages.experience.error")} onRetry={refetch} /></div>}
        {!isLoading && !isError && items.length === 0 && <p className="mt-12 text-center text-[var(--color-text-muted)]">{t("pages.experience.empty")}</p>}

        {!isLoading && !isError && items.length > 0 && (
          <ExperienceTimeline
            items={items}
            className="mt-14"
            getMeta={(experience) => `${formatDate(experience.startDate)} — ${experience.isCurrent ? t("pages.experience.present") : formatDate(experience.endDate)}`}
            renderItem={renderExperienceCard}
          />
        )}

        <motion.div
          className="mt-14 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] p-8 shadow-md transition-shadow duration-300 hover:shadow-lg sm:p-10"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">{t("nav.resume")}</span>
              <h3 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)]">{t("pages.resume.heroTitle")}</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">{t("pages.resume.heroDescription")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/resume" variant="outline">{t("nav.resume")} <FiArrowRight className="rtl-flip" /></Button>
              {resumeUrl && <Button href={resumeUrl} download target="_blank">{t("pages.resume.downloadPdf")} <FiDownload /></Button>}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-6 text-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: reduceMotion ? 0 : 0.2 }}
        >
          <Link to="/education" className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-secondary)]">{t("pages.experience.viewEducation")}</Link>
          <span className="text-[var(--color-border)]">•</span>
          <Link to="/certifications" className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-secondary)]">{t("pages.experience.viewCertifications")}</Link>
        </motion.div>
      </div>
    </section>
  );
}

