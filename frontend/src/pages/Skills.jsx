import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import { useSkills } from "@/hooks/queries/useSkills";
import { groupSkillsByCategory } from "@/utils/skillGrouping";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

gsap.registerPlugin(ScrollTrigger);

export default function Skills() {
  const { t } = useTranslation();
  const { data: skills, isLoading, isError, refetch } = useSkills();
  const categories = groupSkillsByCategory(skills);
  const containerRef = useRef(null);

  useEffect(() => {
    const bars = containerRef.current?.querySelectorAll("[data-bar-fill]");
    if (!bars || !bars.length) return;

    const ctx = gsap.context(() => {
      bars.forEach((bar) => {
        const level = bar.dataset.level;
        gsap.fromTo(
          bar,
          { width: "0%" },
          {
            width: `${level}%`,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: bar, start: "top 90%", toggleActions: "play none none reverse" },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [categories.length]);

  return (
    <>
      <Seo
        title={t("pages.skills.title")}
        description={t("pages.skills.seo")}
        keywords={["React", "Node.js", "MongoDB", "Flutter", "frontend", "backend", "full-stack skills"]}
        path="/skills"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.skills"), path: "/skills" }])]}
      />
      <PageHero
        eyebrow={t("pages.skills.eyebrow")}
        title={t("pages.skills.heroTitle")}
        description={t("pages.skills.heroDescription")}
      />

      <section ref={containerRef} className="container-page py-16 md:py-20">
        {isLoading && <SectionLoader label={t("pages.skills.loading")} />}
        {isError && <ErrorState message={t("pages.skills.error")} onRetry={refetch} />}

        {!isLoading && !isError && categories.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.skills.empty")}</p>
        )}

        {!isLoading && !isError && categories.length > 0 && (
          <div className={categories.length === 1 ? "mx-auto grid max-w-4xl gap-7" : "grid gap-7 lg:grid-cols-2"}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6"
              >
                <h2 className="border-b border-[var(--color-border)] pb-4 font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
                  {cat.label}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {cat.skills.map((skill) => (
                    <article key={skill._id || skill.name} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:shadow-lg">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)]">
                          {skill.name}
                          {skill.featured && <span className="ms-1.5 text-[var(--color-highlight)]">★</span>}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{skill.level}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          data-bar-fill
                          data-level={skill.level}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                          style={{ width: 0 }}
                        />
                      </div>
                      {skill.description && (
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                          {skill.description}
                        </p>
                      )}
                      {skill.relatedProjects?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {skill.relatedProjects.map((proj) => (
                            <Link
                              key={proj._id}
                              to={`/projects/${proj.slug}`}
                              className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                            >
                              {proj.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
