import { useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiCalendar, FiCheckCircle, FiDownload, FiCode, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useExperiences } from "@/hooks/queries/useCareer";
import { useProfile } from "@/hooks/queries/useProfile";
import { formatDate } from "@/components/common/TimelineItem";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import TechIcon from "@/components/ui/TechIcon";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function ExperiencePreview() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: experiences, isLoading, isError, refetch } = useExperiences();
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState("all");
  const filteredExperiences = (experiences || []).filter((experience) => (
    filter === "all" || Boolean(experience.isCurrent) === (filter === "current")
  ));
  const items = filteredExperiences;

  return (
    <section id="experience" className="relative overflow-hidden bg-[var(--color-surface)] py-24 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute start-0 top-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute end-0 bottom-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container-page">
        <SectionHeading eyebrow={t("pages.experience.eyebrow")} title={t("pages.experience.heroTitle")} description={t("pages.experience.heroDescription")} align="center" />

        {!isLoading && !isError && (experiences || []).length > 0 && (
          <motion.div className="mt-10 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            {[
              ["all", t("categories.all")],
              ["current", t("pages.experience.present")],
              ["previous", t("common.previous")],
            ].map(([value, label]) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${filter === value ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25" : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-muted)]"}`}
              >
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}

        {isLoading && <div className="mt-12"><SectionLoader label={t("pages.experience.loading")} /></div>}
        {isError && <div className="mt-12"><ErrorState message={t("pages.experience.error")} onRetry={refetch} /></div>}
        {!isLoading && !isError && items.length === 0 && <p className="mt-12 text-center text-[var(--color-text-muted)]">{t("pages.experience.empty")}</p>}

        {!isLoading && !isError && items.length > 0 && (
          <motion.div className={items.length === 1 ? "relative mx-auto mt-16 grid max-w-md grid-cols-1 gap-5" : items.length === 2 ? "relative mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2" : "relative mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2 xl:max-w-6xl xl:grid-cols-3"} variants={containerVariants} initial={reduceMotion ? false : "hidden"} whileInView={reduceMotion ? undefined : "visible"} viewport={{ once: true, amount: 0.05 }}>
              {items.map((experience) => (
                <motion.article
                  key={experience._id}
                  variants={itemVariants}
                  className="group relative h-full min-w-0"
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-border))] bg-[var(--color-card)] p-5 shadow-[0_18px_55px_-38px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--color-primary)]/45 hover:shadow-[0_28px_70px_-38px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] sm:p-5">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--color-primary)_13%,transparent),transparent_72%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                    <div aria-hidden="true" className="absolute inset-y-7 start-0 w-1 rounded-e-full bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-secondary)] to-transparent opacity-70 transition-all duration-500 group-hover:inset-y-5 group-hover:opacity-100" />
                    
                    {/* Current badge */}
                    {experience.isCurrent && (
                      <motion.div 
                        className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-secondary)]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                      >
                        <FiStar size={12} className="fill-current" />
                        {t("pages.experience.current")}
                      </motion.div>
                    )}

                    {/* Header with icon */}
                    <div className="mb-4 flex min-h-[4.5rem] items-start gap-3 sm:gap-3.5">
                      <motion.div 
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-secondary)]/15 text-[var(--color-primary)]"
                        whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: 4 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <FiBriefcase size={20} />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 break-words font-[var(--font-display)] text-lg font-bold leading-snug text-[var(--color-text-primary)]">{experience.position}</h3>
                        <p className="mt-1 font-semibold text-[var(--color-primary)]">{experience.company}</p>
                        {experience.location && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{experience.location}</p>}
                      </div>
                    </div>

                    {/* Date range */}
                    <motion.div 
                      className="mb-4 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                    >
                      <FiCalendar size={15} className="text-[var(--color-primary)]" />
                      {formatDate(experience.startDate)} â€” {experience.isCurrent ? <span className="text-[var(--color-secondary)] font-semibold">{t("pages.experience.present")}</span> : formatDate(experience.endDate)}
                    </motion.div>

                    {/* Description */}
                    {experience.description && (
                      <motion.p 
                        className="line-clamp-4 min-h-[5.5rem] text-sm leading-[1.4rem] text-[var(--color-text-secondary)]"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                      >
                        {experience.description}
                      </motion.p>
                    )}

                    {/* Responsibilities */}
                    {experience.responsibilities?.length > 0 && (
                      <motion.div 
                        className="mt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                      >
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                          <FiCode size={16} className="text-[var(--color-primary)]" />
                          {t("common.responsibilities")}
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {experience.responsibilities.slice(0, 2).map((item, idx) => (
                            <motion.li 
                              key={item} 
                              className="flex gap-3 items-start"
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.25 + idx * 0.05 }}
                            >
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                              <span className="line-clamp-2">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* Achievements */}
                    {experience.achievements?.length > 0 && (
                      <motion.div 
                        className="mt-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25 }}
                      >
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                          <FiCheckCircle size={16} className="text-[var(--color-secondary)]" />
                          {t("adminValidation.fields.achievements")}
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--color-secondary)]">
                          {experience.achievements.slice(0, 1).map((achievement) => (
                            <li key={achievement} className="flex gap-2 items-start">
                              <span className="text-lg">âœ¨</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    {/* Technologies */}
                    {experience.technologies?.length > 0 && (
                      <motion.div 
                        className="mt-auto flex flex-wrap gap-2 pt-5"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                      >
                        {experience.technologies.slice(0, 5).map((tech, idx) => (
                          <motion.div
                            key={tech}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.35 + idx * 0.05 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                          >
                            <TechIcon 
                              name={tech} 
                              className="h-6 w-6"
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.article>
              ))}
          </motion.div>
        )}

        <motion.div 
          className="mt-14 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Button href="/experience" variant="outline">{t("pages.experience.title")} <FiArrowRight className="rtl-flip" /></Button>
        </motion.div>

        {/* Resume CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, amount: 0.2 }} 
          transition={{ duration: 0.7 }}
          className="mt-16 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] p-8 shadow-md hover:shadow-lg transition-shadow duration-300 sm:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">{t("nav.resume")}</span>
              <h3 className="mt-2 font-[var(--font-display)] text-3xl font-bold text-[var(--color-text-primary)]">{t("pages.resume.heroTitle")}</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">{t("pages.resume.heroDescription")}</p>
            </motion.div>
            <motion.div 
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button href="/resume" variant="outline">{t("nav.resume")} <FiArrowRight className="rtl-flip" /></Button>
              {(profile?.resumeUrl || DEFAULT_RESUME_URL) && (
                <Button href={profile?.resumeUrl || DEFAULT_RESUME_URL} download target="_blank">{t("pages.resume.downloadPdf")} <FiDownload /></Button>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Footer links */}
        <motion.div 
          className="mt-8 flex flex-wrap justify-center gap-6 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/education" className="text-[var(--color-primary)] font-medium hover:text-[var(--color-secondary)] transition-colors">{t("pages.experience.viewEducation")}</Link>
          <span className="text-[var(--color-border)]">â€¢</span>
          <Link to="/certifications" className="text-[var(--color-primary)] font-medium hover:text-[var(--color-secondary)] transition-colors">{t("pages.experience.viewCertifications")}</Link>
        </motion.div>
      </div>
    </section>
  );
}

