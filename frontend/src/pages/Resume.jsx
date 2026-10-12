import { useState } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { DEFAULT_PROFILE_IMAGE } from "@/config/profileAssets";
import { FiDownload, FiMail, FiPhone, FiMapPin, FiEye, FiEyeOff } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import Button from "@/components/ui/Button";
import TimelineItem, { formatDate } from "@/components/common/TimelineItem";
import { useProfile } from "@/hooks/queries/useProfile";
import { useExperiences, useEducationList, useCertifications } from "@/hooks/queries/useCareer";
import { useSkills } from "@/hooks/queries/useSkills";
import { groupSkillsByCategory } from "@/utils/skillGrouping";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

export default function Resume() {
  const { t } = useTranslation();
  const { data: profile, isLoading: loadingProfile, isError: errorProfile, refetch: refetchProfile } = useProfile();
  const experienceQuery = useExperiences();
  const educationQuery = useEducationList();
  const certificationQuery = useCertifications();
  const skillQuery = useSkills();
  const experiences = experienceQuery.data;
  const educationList = educationQuery.data;
  const certifications = certificationQuery.data;
  const skills = skillQuery.data;
  const loadingContent = [experienceQuery, educationQuery, certificationQuery, skillQuery].some((query) => query.isLoading);
  const errorContent = [experienceQuery, educationQuery, certificationQuery, skillQuery].some((query) => query.isError);
  const skillCategories = groupSkillsByCategory(skills);
  const [showPreview, setShowPreview] = useState(false);
  const resumeUrl = profile?.resumeUrl || DEFAULT_RESUME_URL;
  const hasPdfResume = Boolean(profile?.resumeUrl && /\.pdf(?:$|[?#])/i.test(profile.resumeUrl));

  if (loadingProfile || loadingContent) {
    return (
      <section className="container-page py-24">
        <SectionLoader label={t("pages.resume.loading")} />
      </section>
    );
  }

  if (errorProfile || errorContent) {
    return (
      <section className="container-page py-24">
        <ErrorState
          message={t("pages.resume.error")}
          onRetry={() => {
            refetchProfile();
            experienceQuery.refetch();
            educationQuery.refetch();
            certificationQuery.refetch();
            skillQuery.refetch();
          }}
        />
      </section>
    );
  }

  return (
    <>
      <Seo
        title={t("pages.resume.title")}
        description={t("pages.resume.seo", { name: profile?.name || "Mohammad Khalid" })}
        keywords={["resume", "CV", "full-stack developer resume", "software engineer resume"]}
        path="/resume"
        image={profile?.avatar || DEFAULT_PROFILE_IMAGE}
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.resume"), path: "/resume" }])]}
      />
      <PageHero eyebrow={t("pages.resume.eyebrow")} title={t("pages.resume.heroTitle")} description={t("pages.resume.heroDescription")} />

      <section className="container-page py-16 md:py-20">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-[var(--color-border)] pb-8 sm:flex-row sm:items-center">
          {profile ? (
            <div>
              <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-text-primary)]">{profile.name}</h2>
              <p className="mt-1 font-mono text-sm text-[var(--color-primary)]">{profile.title}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                {profile.email && <span className="flex items-center gap-1.5"><FiMail size={13} /> {profile.email}</span>}
                {profile.phone && <span className="flex items-center gap-1.5"><FiPhone size={13} /> {profile.phone}</span>}
                {profile.location && <span className="flex items-center gap-1.5"><FiMapPin size={13} /> {profile.location}</span>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.misc.resumeEmpty")}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {hasPdfResume && (
              <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? <FiEyeOff /> : <FiEye />} {showPreview ? t("pages.resume.hidePdf") : t("pages.resume.showPdf")}
              </Button>
            )}
            <Button href={resumeUrl} download>
              {t("hero.downloadCv")} <FiDownload />
            </Button>
          </div>
        </div>

        {showPreview && hasPdfResume && (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <iframe
              src={resumeUrl}
              title={t("pages.resume.preview")}
              className="h-[80vh] w-full bg-white"
            />
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            <div>
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
                {t("pages.resume.experience")}
              </h3>
              <div className="mt-6 max-w-2xl">
                {experiences?.length ? experiences.map((exp, i) => (
                  <TimelineItem
                    key={exp._id}
                    index={i}
                    title={exp.position}
                    subtitle={exp.company}
                    meta={exp.location}
                    period={`${formatDate(exp.startDate)} — ${exp.isCurrent ? t("common.present") : formatDate(exp.endDate)}`}
                  >
                    {exp.responsibilities?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-muted)]">
                        {exp.responsibilities.map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                    )}
                  </TimelineItem>
                )) : <p className="text-sm text-[var(--color-text-muted)]">{t("pages.experience.empty")}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)]">
                {t("pages.resume.education")}
              </h3>
              <div className="mt-6 max-w-2xl">
                {educationList?.length ? educationList.map((edu, i) => (
                  <TimelineItem
                    key={edu._id}
                    index={i}
                    title={edu.degree}
                    subtitle={edu.university}
                    period={`${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`}
                  />
                )) : <p className="text-sm text-[var(--color-text-muted)]">{t("pages.education.empty")}</p>}
              </div>
            </div>
          </div>

          <aside className="h-fit space-y-8">
            <div>
              <h3 className="font-mono text-sm text-[var(--color-primary)]">{t("pages.resume.skills")}</h3>
              <div className="mt-3 space-y-4">
                {skillCategories.length ? skillCategories.map((cat) => (
                  <div key={cat.id}>
                    <p className="font-mono text-xs text-[var(--color-text-muted)]">{cat.label}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-primary)]">
                      {cat.skills.map((s) => s.name).join(", ")}
                    </p>
                  </div>
                )) : <p className="text-sm text-[var(--color-text-muted)]">{t("pages.skills.empty")}</p>}
              </div>
            </div>

            {certifications?.length > 0 && (
              <div>
                <h3 className="font-mono text-sm text-[var(--color-primary)]">{t("pages.resume.certifications")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-primary)]">
                  {certifications.map((cert) => (
                    <li key={cert._id}>
                      {cert.name}
                      <span className="block font-mono text-xs text-[var(--color-text-muted)]">
                        {cert.organization}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {profile?.languages?.length > 0 && (
              <div>
                <h3 className="font-mono text-sm text-[var(--color-primary)]">{t("pages.resume.languages")}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-text-primary)]">
                  {profile.languages.map((lang) => (
                    <li key={lang.name} className="flex items-center justify-between">
                      <span>{lang.name}</span>
                      {lang.level && <span className="font-mono text-xs text-[var(--color-text-muted)]">{lang.level}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
