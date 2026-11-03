import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import { useTestimonials } from "@/hooks/queries/useTestimonials";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";
import TestimonialSubmissionForm from "@/components/common/TestimonialSubmissionForm";

export default function Testimonials() {
  const { t } = useTranslation();
  const { data: testimonials, isLoading, isError, refetch } = useTestimonials();

  return (
    <>
      <Seo
        title={t("pages.testimonials.title")}
        description={t("pages.testimonials.seo")}
        keywords={["developer testimonials", "client feedback", "software engineer reviews", "full-stack developer testimonials"]}
        path="/testimonials"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.testimonials"), path: "/testimonials" }])]}
      />
      <PageHero
        eyebrow={t("pages.testimonials.eyebrow")}
        title={t("pages.testimonials.heroTitle")}
        description={t("pages.testimonials.heroDescription")}
      />

      <section className="container-page py-16 md:py-20">
        {isLoading && <SectionLoader label={t("pages.testimonials.loading")} />}
        {isError && <ErrorState message={t("pages.testimonials.error")} onRetry={refetch} />}
        {!isLoading && !isError && !testimonials?.length && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.testimonials.empty")}</p>
        )}

        {!isLoading && !isError && testimonials?.length > 0 && (
        <div className={testimonials.length === 1 ? "mx-auto grid max-w-4xl gap-5" : "grid gap-5 md:grid-cols-2 lg:grid-cols-3"}>
            {testimonials.map((testimonial, i) => {
              const rating = Math.min(5, Math.max(1, Number(testimonial.rating) || 5));
              return (
              <motion.blockquote
                key={testimonial._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)] to-[var(--color-surface-muted)] p-6 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-xl sm:p-7"
              >
                <span aria-hidden="true" className="absolute end-5 top-2 font-serif text-7xl leading-none text-[var(--color-primary)]/10">“</span>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex max-w-full items-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
                    {t(`pages.testimonials.topics.${testimonial.topic || "website"}`)}{testimonial.subject ? ` · ${testimonial.subject}` : ""}
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1.5" role="img" aria-label={t("pages.testimonials.ratingValue", { count: rating })}>
                    <span className="flex gap-0.5 text-[var(--color-highlight)]" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, idx) => <FiStar key={idx} size={13} fill={idx < rating ? "currentColor" : "none"} className={idx < rating ? "" : "opacity-40"} />)}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[var(--color-text-primary)]">{rating}/5</span>
                  </div>
                </div>
                <p className="relative mt-6 flex-1 text-base leading-7 text-[var(--color-text-primary)]">“{testimonial.message}”</p>
                <footer className="mt-5 border-t border-[var(--color-border)] pt-4">
                  <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)]">
                    {testimonial.name}
                  </p>
                  <p className="font-mono text-xs text-[var(--color-text-muted)]">
                    {testimonial.position} {testimonial.position && testimonial.company && "·"} {testimonial.company}
                  </p>
                </footer>
              </motion.blockquote>
              );
            })}
          </div>
        )}
        <div className="mt-16"><TestimonialSubmissionForm /></div>
      </section>
    </>
  );
}
