import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiGithub, FiExternalLink, FiFileText, FiPlayCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useProject } from "@/hooks/queries/useProjects";
import { useSettings } from "@/hooks/queries/useSettings";
import Button from "@/components/ui/Button";
import ProjectCard from "@/components/cards/ProjectCard";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import { useContentAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import Seo, { buildBreadcrumbSchema, buildProjectSchema } from "@/components/seo/Seo";
import NotFound from "./NotFound";
import { resolveMediaUrl } from "@/utils/resolveMediaUrl";

function CaseStudySection({ eyebrow, title, children }) {
  if (!children) return null;
  return (
    <div className="border-t border-[var(--color-border)] py-8 first:border-t-0 first:pt-0">
      <p className="font-mono text-sm text-[var(--color-primary)]">{eyebrow}</p>
      <h2 className="mt-2 font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div className="mt-3 leading-relaxed text-[var(--color-text-muted)]">{children}</div>
    </div>
  );
}

/** Renders a video as an embed for YouTube/Vimeo links, or a plain link otherwise. */
function VideoEmbed({ url, videoTitle, watchLabel }) {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  if (youtubeMatch) {
    return (
      <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          title={videoTitle}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (vimeoMatch) {
    return (
      <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          title={videoTitle}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-primary)] hover:underline"
    >
      <FiPlayCircle /> {watchLabel}
    </a>
  );
}

export default function ProjectDetails() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError, error, refetch } = useProject(slug);
  const { data: settings } = useSettings();
  useContentAnalyticsTracking({
    enabled: Boolean(project?._id),
    path: `/projects/${slug}`,
    eventType: "project_view",
    contentType: "project",
    contentId: project?._id,
    contentTitle: project?.title,
  });

  if (isLoading) {
    return (
      <section className="container-page py-24">
        <SectionLoader label={t("pages.projectDetails.loading")} />
      </section>
    );
  }

  if (isError) {
    if (error?.message?.toLowerCase().includes("not found")) return <NotFound />;
    return (
      <section className="container-page py-24">
        <ErrorState message={t("pages.projectDetails.error")} onRetry={refetch} />
      </section>
    );
  }

  if (!project) return <NotFound />;
  const thumbnailUrl = resolveMediaUrl(project.thumbnail);
  const canonicalPath = `/projects/${project.slug}`;
  const seoDescription = project.seoDescription || project.description;

  return (
    <>
      <Seo
        title={project.seoTitle || project.title}
        description={seoDescription}
        keywords={project.seoKeywords?.length ? project.seoKeywords : project.technologies}
        path={canonicalPath}
        image={thumbnailUrl}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: t("nav.home"), path: "/" },
            { name: t("nav.projects"), path: "/projects" },
            { name: project.title, path: canonicalPath },
          ], settings),
          buildProjectSchema({ project, canonical: canonicalPath, description: seoDescription }, settings),
        ]}
      />
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container-page py-16 md:py-20">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          >
            <FiArrowLeft className="rtl-flip" size={14} /> {t("pages.projectDetails.back")}
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-8 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl shadow-black/10">
              {thumbnailUrl ? <img src={thumbnailUrl} alt={project.title} className="h-full w-full object-cover" fetchPriority="high" /> : <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-primary)_24%,transparent),transparent_65%)]" />}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-gray-950/50 to-transparent" />
            </div>

            <div>
            {project.category && <span className="inline-flex rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">{project.category}</span>}
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-text-primary)] md:text-5xl">
              {project.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">{project.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {project.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-muted)]"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {project.demo && (
                <Button href={project.demo}>
                  {t("pages.projectDetails.demo")} <FiExternalLink />
                </Button>
              )}
              {project.github && (
                <Button href={project.github} variant="outline">
                  <FiGithub /> {t("pages.projectDetails.code")}
                </Button>
              )}
              {project.documentation && (
                <Button href={project.documentation} variant="outline">
                  <FiFileText /> {t("pages.projectDetails.docs")}
                </Button>
              )}
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div>
          <CaseStudySection eyebrow={t("pages.projectDetails.overview")} title={t("pages.projectDetails.overviewTitle")}>
            {project.fullDescription && <p>{project.fullDescription}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.features")} title={t("pages.projectDetails.featuresTitle")}>
            {project.features?.length > 0 && (
              <ul className="space-y-2">
                {project.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[var(--color-primary)]">→</span> {f}
                  </li>
                ))}
              </ul>
            )}
          </CaseStudySection>

          {project.gallery?.length > 0 && (
            <CaseStudySection eyebrow={t("pages.projectDetails.screenshots")} title={t("pages.projectDetails.screenshotsTitle")}>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.gallery.map((src, i) => (
                  <div
                    key={src}
                    className="aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
                  >
                    <img
                      src={resolveMediaUrl(src)}
                      alt={`${project.title} screenshot ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </CaseStudySection>
          )}

          {project.videoDemo && (
            <CaseStudySection eyebrow={t("pages.projectDetails.video")} title={t("pages.projectDetails.video")}>
              <VideoEmbed url={project.videoDemo} videoTitle={t("pages.projectDetails.video")} watchLabel={t("pages.projectDetails.watchVideo")} />
            </CaseStudySection>
          )}

          <CaseStudySection eyebrow={t("pages.projectDetails.architecture")} title={t("pages.projectDetails.architectureTitle")}>
            {project.architecture && <p className="whitespace-pre-line">{project.architecture}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.challenge")} title={t("pages.projectDetails.challengeTitle")}>
            {project.challenges && <p>{project.challenges}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.solution")} title={t("pages.projectDetails.solutionTitle")}>
            {project.solutions && <p>{project.solutions}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.security")} title={t("pages.projectDetails.securityTitle")}>
            {project.security && <p>{project.security}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.performance")} title={t("pages.projectDetails.performanceTitle")}>
            {project.performance && <p>{project.performance}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.results")} title={t("pages.projectDetails.resultsTitle")}>
            {project.results && <p>{project.results}</p>}
          </CaseStudySection>

          <CaseStudySection eyebrow={t("pages.projectDetails.lessons")} title={t("pages.projectDetails.lessonsTitle")}>
            {project.lessonsLearned && <p>{project.lessonsLearned}</p>}
          </CaseStudySection>
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg shadow-black/5 lg:sticky lg:top-28">
          <p className="font-mono text-sm text-[var(--color-primary)]">{t("pages.projectDetails.stack")}</p>
          <ul className="mt-3 space-y-2 font-mono text-sm text-[var(--color-text-primary)]">
            {project.technologies?.map((tech) => (
              <li key={tech}>· {tech}</li>
            ))}
          </ul>
          {project.category && (
            <>
              <p className="mt-6 font-mono text-sm text-[var(--color-primary)]">{t("pages.projectDetails.category")}</p>
              <p className="mt-2 font-mono text-sm capitalize text-[var(--color-text-primary)]">{project.category}</p>
            </>
          )}
        </aside>
      </section>

      {project.relatedProjects?.length > 0 && (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-16 md:py-20">
          <div className="container-page">
            <p className="font-mono text-sm text-[var(--color-primary)]">{t("pages.projectDetails.related")}</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-text-primary)]">
              {t("pages.projectDetails.relatedTitle")}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {project.relatedProjects.map((related) => (
                <div
                  key={related._id}
                  onClick={() => navigate(`/projects/${related.slug}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.target.closest("a, button")) {
                      event.preventDefault();
                      navigate(`/projects/${related.slug}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={related.title}
                  className="cursor-pointer rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
                >
                  <ProjectCard project={related} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
