import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "@/components/cards/ProjectCard";
import Button from "@/components/ui/Button";
import { useProjects } from "@/hooks/queries/useProjects";
import { CardSkeleton } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

const CATEGORY_IDS = ["all", "web", "mobile", "backend", "ai", "ui-ux", "other"];

export default function Projects() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const categories = CATEGORY_IDS.map((id) => ({
    id,
    label: id === "other"
      ? t("categories.other")
      : t("pages.projects." + (id === "ui-ux" ? "uiux" : id)),
  }));
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const projectParams = useMemo(
    () => ({
      category: category === "all" ? undefined : category,
      search: trimmedQuery || undefined,
    }),
    [category, trimmedQuery]
  );
  const hasActiveFilters = category !== "all" || Boolean(trimmedQuery);
  const { data: projects, isLoading, isError, refetch } = useProjects(projectParams);
  const filteredProjects = projects || [];
  const featuredProjects = filteredProjects.filter((project) => project.featured);
  const showFeatured = category === "all" && !trimmedQuery && featuredProjects.length > 0;

  function renderProjectCard(project, index, featured = false) {
    return (
      <div
        key={project._id}
        onClick={() => navigate("/projects/" + project.slug)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.target.closest("a, button")) {
            event.preventDefault();
            navigate("/projects/" + project.slug);
          }
        }}
        role="link"
        tabIndex={0}
        aria-label={project.title}
        className="cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
      >
        <ProjectCard project={project} featured={featured} showFeaturedBadge={featured} index={index} />
      </div>
    );
  }

  return (
    <>
      <Seo
        title={t("pages.projects.title")}
        description={t("pages.projects.seo")}
        keywords={["portfolio projects", "React projects", "Node.js projects", "Flutter projects", "case studies"]}
        path="/projects"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.projects"), path: "/projects" }])]}
      />

      <section id="projects" className="relative overflow-hidden bg-[var(--color-background)] py-24 sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute end-0 top-1/4 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
          <div className="absolute start-0 bottom-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_3%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="container-page">
          <SectionHeading
            eyebrow={t("sections.projects.eyebrow")}
            title={t("pages.projects.heroTitle")}
            description={t("pages.projects.heroDescription")}
            align="center"
            maxWidth="max-w-3xl"
            titleClassName="text-3xl sm:text-4xl lg:text-5xl"
            descriptionClassName="max-w-2xl text-base leading-8 sm:text-lg"
          />

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.1 }}
            className="mt-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <label className="relative w-full lg:max-w-sm">
              <FiSearch className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("pages.projects.search")}
                aria-label={t("pages.projects.search")}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-3 pe-4 ps-11 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {categories.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={active}
                    className={[
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                      active
                        ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                        : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {isError && <div className="mt-10"><ErrorState message={t("pages.projects.loadingError")} onRetry={refetch} /></div>}

          {!isError && isLoading && (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => <CardSkeleton key={item} />)}
            </div>
          )}

          {!isError && !isLoading && filteredProjects.length === 0 && (
            <div className="mt-14 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                {hasActiveFilters ? t("pages.projects.noResults") : t("pages.projects.empty")}
              </h3>
            </div>
          )}

          {!isError && !isLoading && filteredProjects.length > 0 && (
            <>
              {showFeatured && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.7 }}
                  className="mt-14"
                >
                  <div className="mb-6">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                      {t("pages.projects.eyebrow")}
                    </span>
                    <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-[var(--color-text-primary)]">
                      {t("sections.projects.title")}
                    </h2>
                  </div>
                  <div className={featuredProjects.length === 1 ? "mx-auto max-w-5xl" : "grid gap-6 lg:grid-cols-2"}>
                    {featuredProjects.map((project, index) => renderProjectCard(project, index, true))}
                  </div>
                </motion.div>
              )}

              <div className="mt-14">
                <div className="mb-6">
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                    {t("pages.projects.eyebrow")}
                  </span>
                  <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold text-[var(--color-text-primary)]">
                    {hasActiveFilters ? t("pages.projects.title") : t("nav.projects")}
                  </h2>
                </div>
                <div className={filteredProjects.length === 1 ? "mx-auto max-w-5xl" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"}>
                  {filteredProjects.map((project, index) => renderProjectCard(project, index))}
                </div>
              </div>
            </>
          )}

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.7 }}
            className="mt-14 overflow-hidden rounded-2xl border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/[0.04] p-7 sm:p-9"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                  {t("sections.cta.eyebrow")}
                </span>
                <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
                  {t("sections.cta.title")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {t("pages.projects.heroDescription")}
                </p>
              </div>
              <Button href="/contact" className="shrink-0">
                {t("sections.cta.button")} <FiArrowRight className="rtl-flip" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
