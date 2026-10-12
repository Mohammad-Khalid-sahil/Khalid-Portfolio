import { useMemo, useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { motion } from "framer-motion";
import { FiArrowRight, FiBriefcase, FiCalendar, FiCheckCircle, FiDownload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { ErrorState } from "@/components/loaders/ErrorState";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";
import { useExperiences } from "@/hooks/queries/useCareer";
import { useProfile } from "@/hooks/queries/useProfile";
import { formatDate } from "@/components/common/TimelineItem";

export default function Experience() {
  const { t } = useTranslation();
  const { data: experiences, isLoading, isError, refetch } = useExperiences();
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () => (experiences || []).filter((item) => (
      filter === "all" || Boolean(item.isCurrent) === (filter === "current")
    )),
    [experiences, filter]
  );

  const filters = [
    ["all", t("categories.all")],
    ["current", t("pages.experience.present")],
    ["previous", t("common.previous")],
  ];

  return (
    <>
      <Seo
        title={t("pages.experience.title")}
        description={t("pages.experience.seo")}
        keywords={["software engineer experience", "full-stack developer experience", "career timeline", "technical achievements"]}
        path="/experience"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.experience"), path: "/experience" }])]}
      />

      <section className="relative overflow-hidden bg-[var(--color-surface)] py-24 sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute start-0 top-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
          <div className="absolute end-0 bottom-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="container-page">
          <motion.header
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
              <FiBriefcase size={15} />
              {t("pages.experience.eyebrow")}
            </span>
            <h1 className="mt-5 font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              {t("pages.experience.heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">
              {t("pages.experience.heroDescription")}
            </p>
          </motion.header>

          {!isLoading && !isError && (experiences || []).length > 0 && (
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              aria-label={t("pages.experience.title")}
              className="mt-10 flex flex-wrap justify-center gap-2"
            >
              {filters.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={[
                    "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                    filter === value
                      ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                      : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </motion.nav>
          )}

          {isLoading && <div className="mt-12"><SectionLoader label={t("pages.experience.loading")} /></div>}
          {isError && <div className="mt-12"><ErrorState message={t("pages.experience.error")} onRetry={refetch} /></div>}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="mt-14 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("pages.experience.empty")}</h2>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="relative mx-auto mt-16 max-w-5xl">
              <div aria-hidden="true" className="absolute bottom-0 start-3 top-0 w-px bg-gradient-to-b from-transparent via-[var(--color-primary)]/30 to-transparent lg:start-1/2 lg:-translate-x-1/2" />
              <div className="space-y-12 lg:space-y-20">
                {filtered.map((experience, index) => {
                  const isLeft = index % 2 === 0;
                  const dateRange = formatDate(experience.startDate) + " — " + (
                    experience.isCurrent ? t("pages.experience.present") : formatDate(experience.endDate)
                  );

                  return (
                    <motion.article
                      key={experience._id}
                      initial={{ opacity: 0, x: isLeft ? -35 : 35 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.7 }}
                      className="relative lg:grid lg:grid-cols-2 lg:gap-16"
                    >
                      <span aria-hidden="true" className="absolute start-3 top-8 z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20 lg:start-1/2">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>

                      <div className={["hidden pt-7 lg:flex", isLeft ? "lg:col-start-2 lg:justify-start" : "lg:col-start-1 lg:justify-end"].join(" ")}>
                        <span className="inline-flex h-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] shadow-sm">
                          <FiCalendar size={15} className="text-[var(--color-primary)]" />
                          {dateRange}
                        </span>
                      </div>

                      <div className={["ps-10 lg:row-start-1", isLeft ? "lg:col-start-1" : "lg:col-start-2"].join(" ")}>
                        <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-2xl">
                          <header className="border-b border-[var(--color-border)] p-6 sm:p-7">
                            <div className="flex items-start gap-4">
                              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                                <FiBriefcase size={21} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <h2 className="font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">{experience.position}</h2>
                                <p className="mt-1 font-semibold text-[var(--color-primary)]">{experience.company}</p>
                                {experience.location && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{experience.location}</p>}
                              </div>
                            </div>
                            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] lg:hidden">
                              <FiCalendar size={13} className="text-[var(--color-primary)]" />
                              {dateRange}
                            </span>
                          </header>

                          <div className="p-6 sm:p-7">
                            {experience.description && <p className="text-sm leading-7 text-[var(--color-text-muted)]">{experience.description}</p>}

                            {experience.responsibilities?.length > 0 && (
                              <div className="mt-5">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
                                  <FiCheckCircle size={16} className="text-[var(--color-primary)]" />
                                  {t("adminValidation.fields.responsibilities")}
                                </h3>
                                <ul className="mt-4 space-y-3">
                                  {experience.responsibilities.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
                                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {experience.achievements?.length > 0 && (
                              <div className="mt-7">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
                                  <FiCheckCircle size={16} className="text-[var(--color-secondary)]" />
                                  {t("adminValidation.fields.achievements")}
                                </h3>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-primary)]">
                                  {experience.achievements.map((achievement) => <li key={achievement}>★ {achievement}</li>)}
                                </ul>
                              </div>
                            )}

                            {experience.technologies?.length > 0 && (
                              <div className="mt-7">
                                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
                                  {t("adminValidation.fields.technologies")}
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {experience.technologies.map((technology) => (
                                    <span key={technology} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]">
                                      {technology}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Link to="/projects" className="group/link mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                              {t("nav.projects")}
                              <FiArrowRight className="rtl-flip transition-transform duration-300 group-hover/link:translate-x-1" />
                            </Link>
                          </div>
                        </article>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="mt-16 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-sm sm:p-9"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">{t("nav.resume")}</span>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">{t("pages.resume.heroTitle")}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">{t("pages.resume.heroDescription")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/resume" variant="outline">{t("nav.resume")} <FiArrowRight className="rtl-flip" /></Button>
                {(profile?.resumeUrl || DEFAULT_RESUME_URL) && <Button href={profile?.resumeUrl || DEFAULT_RESUME_URL} download>{t("pages.resume.downloadPdf")} <FiDownload /></Button>}
              </div>
            </div>
          </motion.div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/education" className="text-[var(--color-primary)] hover:underline">{t("pages.experience.viewEducation")}</Link>
            <Link to="/certifications" className="text-[var(--color-primary)] hover:underline">{t("pages.experience.viewCertifications")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
