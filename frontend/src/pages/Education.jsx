import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import TimelineItem, { formatDate } from "@/components/common/TimelineItem";
import { useEducationList } from "@/hooks/queries/useCareer";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

export default function Education() {
  const { t } = useTranslation();
  const { data: educationList, isLoading, isError, refetch } = useEducationList();

  return (
    <>
      <Seo
        title={t("pages.education.title")}
        description={t("pages.education.seo")}
        keywords={["software engineering education", "academic background", "computer science coursework", "engineering degree"]}
        path="/education"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.education"), path: "/education" }])]}
      />
      <PageHero
        eyebrow={t("pages.education.eyebrow")}
        title={t("pages.education.heroTitle")}
        description={t("pages.education.heroDescription")}
      />

      <section className="container-page py-16 md:py-20">
        {isLoading && <SectionLoader label={t("pages.education.loading")} />}
        {isError && <ErrorState message={t("pages.education.error")} onRetry={refetch} />}
        {!isLoading && !isError && !educationList?.length && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.education.empty")}</p>
        )}

        {!isLoading && !isError && educationList?.length > 0 && (
          <div className="max-w-2xl">
            {educationList.map((edu, i) => (
              <TimelineItem
                key={edu._id}
                index={i}
                title={edu.degree}
                subtitle={edu.university}
                meta={edu.faculty}
                period={`${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`}
              >
                {edu.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{edu.description}</p>
                )}
                {edu.gpa && <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t("pages.education.gpa", { gpa: edu.gpa })}</p>}
                {edu.courses?.length > 0 && (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {t("pages.education.courses", { courses: edu.courses.join(", ") })}
                  </p>
                )}
                {edu.thesis && (
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t("pages.education.thesis", { thesis: edu.thesis })}</p>
                )}
                {edu.achievements?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-muted)]">
                    {edu.achievements.map((a) => (
                      <li key={a}>· {a}</li>
                    ))}
                  </ul>
                )}
              </TimelineItem>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
