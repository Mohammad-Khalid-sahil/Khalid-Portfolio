import { motion } from "framer-motion";
import { FiExternalLink, FiAward } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import { formatDate } from "@/components/common/TimelineItem";
import { useCertifications } from "@/hooks/queries/useCareer";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

export default function Certifications() {
  const { t } = useTranslation();
  const { data: certifications, isLoading, isError, refetch } = useCertifications();

  return (
    <>
      <Seo
        title={t("pages.certifications.title")}
        description={t("pages.certifications.seo")}
        keywords={["software engineering certifications", "developer certificates", "technical credentials", "verified coursework"]}
        path="/certifications"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.certifications"), path: "/certifications" }])]}
      />
      <PageHero
        eyebrow={t("pages.certifications.eyebrow")}
        title={t("pages.certifications.heroTitle")}
        description={t("pages.certifications.heroDescription")}
      />

      <section className="container-page py-16 md:py-20">
        {isLoading && <SectionLoader label={t("pages.certifications.loading")} />}
        {isError && <ErrorState message={t("pages.certifications.error")} onRetry={refetch} />}
        {!isLoading && !isError && !certifications?.length && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.certifications.empty")}</p>
        )}

        {!isLoading && !isError && certifications?.length > 0 && (
          <div className={certifications.length === 1 ? "mx-auto grid max-w-3xl gap-5" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
            {certifications.map((cert, i) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/50 hover:shadow-xl"
              >
                {cert.image ? (
                  <div className="aspect-[16/10] overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
                    <img
                      src={cert.image}
                      alt={cert.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                    <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--color-highlight)_12%,transparent),transparent_65%)]" />
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-highlight)]/10 text-[var(--color-highlight)]">
                      <FiAward size={18} />
                    </div>
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-text-primary)]">
                    {cert.name}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
                    {cert.organization} · {formatDate(cert.date)}
                  </p>
                  {cert.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{cert.description}</p>
                  )}
                  {cert.credentialId && (
                    <p className="mt-2 font-mono text-xs text-[var(--color-text-muted)]">{t("pages.certifications.id", { id: cert.credentialId })}</p>
                  )}
                  {cert.verificationUrl && (
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-primary)] hover:underline"
                    >
                      {t("pages.certifications.verify")} <FiExternalLink size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
