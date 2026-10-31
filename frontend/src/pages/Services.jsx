import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiCode, FiSmartphone, FiServer, FiDatabase, FiArrowRight, FiStar } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import Button from "@/components/ui/Button";
import { useServiceOfferings } from "@/hooks/queries/useServiceOfferings";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";

const ICONS = { FiCode, FiSmartphone, FiServer, FiDatabase };

export default function Services() {
  const { t } = useTranslation();
  const { data: services, isLoading, isError, refetch } = useServiceOfferings();

  return (
    <>
      <Seo
        title={t("pages.services.title")}
        description={t("pages.services.seo")}
        keywords={["web development services", "mobile development", "backend development", "freelance full-stack developer"]}
        path="/services"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.services"), path: "/services" }])]}
      />
      <PageHero
        eyebrow={t("pages.services.eyebrow")}
        title={t("pages.services.heroTitle")}
        description={t("pages.services.heroDescription")}
      />

      <section className="container-page py-16 md:py-20">
        {isLoading && <SectionLoader label={t("pages.services.loading")} />}
        {isError && <ErrorState message={t("pages.services.error")} onRetry={refetch} />}

        {!isLoading && !isError && (!services || services.length === 0) && (
          <p className="text-center text-[var(--color-text-muted)]">{t("pages.services.empty")}</p>
        )}

        {!isLoading && !isError && services?.length > 0 && (
          <div className={services.length === 1 ? "mx-auto grid max-w-2xl gap-5" : services.length === 2 ? "mx-auto grid max-w-4xl gap-5 sm:grid-cols-2" : "mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 xl:max-w-6xl xl:grid-cols-3"}>
            {services.map((service, i) => {
              const Icon = ICONS[service.icon] || FiCode;
              return (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/50 hover:shadow-xl sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                      <Icon size={22} />
                    </div>
                    {service.featured && (
                      <span className="flex items-center gap-1 rounded-full border border-[var(--color-highlight)]/40 px-2 py-0.5 font-mono text-[10px] text-[var(--color-highlight)]">
                        <FiStar size={10} fill="currentColor" /> {t("pages.services.featured")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
                    {service.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--color-text-muted)]">{service.description}</p>

                  {service.features?.length > 0 && (
                    <ul className="mt-4 space-y-1.5 text-sm leading-6 text-[var(--color-text-muted)]">
                      {service.features.slice(0, 2).map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="text-[var(--color-primary)]">â†’</span> {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {service.technologies?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-[var(--color-border)] px-2.5 py-1 font-mono text-xs text-[var(--color-text-muted)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {service.startingPrice && (
                    <p className="mt-4 font-mono text-xs text-[var(--color-primary)]">
                      {t("pages.services.startingAt", { price: service.startingPrice })}
                    </p>
                  )}

                  <Link
                    to="/contact"
                    className="mt-5 inline-flex items-center gap-1.5 font-mono text-sm text-[var(--color-primary)] hover:underline"
                  >
                    {service.ctaText || t("pages.services.defaultCta")} <FiArrowRight className="rtl-flip" size={13} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center sm:flex-row sm:text-start md:p-9">
          <p className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
            {t("pages.services.discussTitle")}
          </p>
          <Button href="/contact" className="mt-5">
            {t("pages.services.discussButton")} <FiArrowRight className="rtl-flip" />
          </Button>
        </div>
      </section>
    </>
  );
}

