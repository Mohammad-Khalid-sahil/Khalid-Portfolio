import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight, FiExternalLink, FiGithub, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "@/utils/resolveMediaUrl";
import TechIcon from "@/components/ui/TechIcon";

const CATEGORY_TONES = {
  mobile: "--color-accent",
  backend: "--color-secondary",
  default: "--color-primary",
};

function setSpotlight(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

function ExternalProjectAction({ href, icon: Icon, label, compact = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)] text-xs font-semibold text-[var(--color-text-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text-primary)] ${compact ? "h-9 w-9 justify-center" : "px-3.5 py-2.5"}`}
    >
      <Icon size={14} />
      {!compact && label}
    </a>
  );
}

function hostLabel(project) {
  if (project.demo) {
    try {
      return new URL(project.demo).hostname.replace(/^www\./, "");
    } catch {
      return project.demo;
    }
  }
  return `/projects/${project.slug || ""}`;
}

/**
 * Project card. `featured` renders a larger card; `layout="showcase"` renders
 * a wide, two-column spotlight card used for the lead featured project.
 */
export default function ProjectCard({ project, featured = false, showFeaturedBadge = false, index = 0, layout = "card" }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const showcase = layout === "showcase";
  const categoryName = typeof project.category === "object"
    ? project.category?.name || project.category?.title
    : project.category;
  const categoryId = String(categoryName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const categoryKey = categoryId === "ui-ux" ? "uiux" : categoryId;
  const categoryLabel = categoryName
    ? t("pages.projects." + categoryKey, { defaultValue: categoryName })
    : "";
  const badgeLabel = project.type || categoryLabel;
  const tone = CATEGORY_TONES[categoryId] || CATEGORY_TONES.default;
  const thumbnailUrl = resolveMediaUrl(project.thumbnail);
  const technologies = project.technologies || [];
  const techLimit = showcase ? 8 : featured ? 6 : 4;
  const shownTech = technologies.slice(0, techLimit);
  const hiddenTech = technologies.length - shownTech.length;
  const features = (project.features || []).slice(0, showcase ? 4 : featured ? 4 : 3);
  const number = String(index + 1).padStart(2, "0");

  const media = (
    <div className={`relative overflow-hidden rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-surface)] ${showcase ? "h-full min-h-[16rem]" : ""}`}>
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-muted)_70%,transparent)] px-3 py-2" dir="ltr">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ms-2 truncate rounded-md bg-[var(--color-card)] px-2 py-0.5 font-mono text-[0.62rem] text-[var(--color-text-muted)]">{hostLabel(project)}</span>
      </div>
      <div className={`ds-media-zoom relative overflow-hidden ${showcase ? "h-[calc(100%-2rem)] min-h-[14rem]" : featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="relative grid h-full w-full place-items-center overflow-hidden px-6 text-center">
            <div aria-hidden="true" className="ds-grid absolute inset-0 opacity-70" />
            <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 0%, color-mix(in srgb, var(${tone}) 26%, transparent), transparent 65%)` }} />
            <span className="relative font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-secondary)]">{project.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(5_6_11/0.55)] via-transparent to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true">
          <span className="ds-glass inline-flex translate-y-3 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] transition-transform duration-500 group-hover:translate-y-0">
            {t("ui.viewProject")} <FiArrowUpRight className="rtl-flip" size={14} />
          </span>
        </span>
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {badgeLabel ? (
            <span className="ds-glass rounded-full px-3 py-1 text-[0.7rem] font-semibold" style={{ color: `var(${tone})` }}>{badgeLabel}</span>
          ) : <span />}
          {showFeaturedBadge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[0.7rem] font-semibold text-white shadow-[0_8px_20px_-8px_var(--ds-glow)]">
              <FiStar size={11} /> {t("pages.services.featured")}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const body = (
    <div className={`flex flex-1 flex-col ${showcase ? "p-2 sm:p-4 lg:p-6" : "px-2 pb-2 pt-5 sm:px-3"}`}>
      <div className="flex items-start justify-between gap-4">
        <h3 className={`font-[var(--font-display)] font-semibold tracking-tight text-[var(--color-text-primary)] ${showcase ? "text-2xl sm:text-3xl lg:text-[2.1rem] lg:leading-tight" : featured ? "text-2xl" : "text-xl"}`}>
          {project.title}
        </h3>
        <span className="mt-1 shrink-0 font-mono text-xs text-[var(--color-text-muted)]" dir="ltr">{number}</span>
      </div>
      <p className={`mt-3 text-sm leading-7 text-[var(--color-text-muted)] ${showcase ? "sm:text-base sm:leading-8" : "ds-clamp-3"}`}>
        {project.description}
      </p>

      {features.length > 0 && (showcase || featured) && (
        <ul className={`mt-5 grid gap-2 ${showcase ? "sm:grid-cols-2" : ""}`}>
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[0.8rem] leading-5 text-[var(--color-text-secondary)]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: `var(${tone})` }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {shownTech.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {shownTech.map((technology) => (
            <span key={technology} className="ds-chip">
              <TechIcon name={technology} size={11} className="text-[var(--color-text-muted)]" />
              {technology}
            </span>
          ))}
          {hiddenTech > 0 && <span className="ds-chip" dir="ltr">+{hiddenTech}</span>}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-6">
        <Link
          to={"/projects/" + project.slug}
          onClick={(event) => event.stopPropagation()}
          className="group/cta inline-flex items-center gap-2 rounded-xl bg-[var(--color-text-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--color-background)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary)] hover:text-white"
        >
          {t("pages.projectDetails.caseStudy")}
          <FiArrowRight className="rtl-flip transition-transform duration-300 group-hover/cta:translate-x-0.5" size={14} />
        </Link>
        {project.github && (
          <ExternalProjectAction href={project.github} icon={FiGithub} label={t("common.githubRepo")} compact={!showcase} />
        )}
        {project.demo && (
          <ExternalProjectAction href={project.demo} icon={FiExternalLink} label={t("common.liveDemo")} compact={!showcase && !featured} />
        )}
      </div>
    </div>
  );

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduce ? 0 : 0.85, delay: reduce || showcase ? 0 : (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={setSpotlight}
      className={`group ds-card ds-spotlight ds-card--interactive flex h-full p-3 ${showcase ? "flex-col gap-4 lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-4" : "flex-col"}`}
    >
      {media}
      {body}
    </motion.article>
  );
}
