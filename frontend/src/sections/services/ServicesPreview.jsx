import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiArrowUpRight, FiCheck, FiCode, FiSmartphone, FiServer, FiDatabase } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useServiceOfferings } from "@/hooks/queries/useServiceOfferings";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { rise, stagger } from "@/components/ui/Reveal";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

const ICONS = { FiCode, FiSmartphone, FiServer, FiDatabase };
const TONES = ["--color-primary", "--color-secondary", "--color-accent"];

export default function ServicesPreview() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data: services, isLoading, isError, refetch } = useServiceOfferings();

  return (
    <section id="services" className="ds-section overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--color-surface)_80%,transparent)_20%,color-mix(in_srgb,var(--color-surface)_80%,transparent)_80%,transparent)]" />
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="03" eyebrow={t("sections.services.eyebrow")} title={t("sections.services.title")} description={t("pages.services.heroDescription")} maxWidth="max-w-3xl" />
          <Button href="/services" variant="outline" className="shrink-0 self-start lg:self-auto">{t("sections.services.viewAll")} <FiArrowRight className="rtl-flip" /></Button>
        </div>

        {isLoading && <div className="mt-10"><SectionLoader label={t("pages.services.loading")} /></div>}
        {isError && <div className="mt-10"><ErrorState message={t("pages.services.error")} onRetry={refetch} /></div>}
        {!isLoading && !isError && !services?.length && <p className="mt-10 text-center text-[var(--color-text-muted)]">{t("pages.services.empty")}</p>}

        {!isLoading && !isError && services?.length > 0 && (
          <motion.div
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger(0, 0.08)}
            className={services.length === 1 ? "mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4" : "mt-14 grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3"}
          >
            {services.map((service, index) => {
              const Icon = ICONS[service.icon] || FiCode;
              const tone = TONES[index % TONES.length];
              return (
                <motion.div key={service._id} variants={rise} className="h-full">
                  <SpotlightCard as="article" className="group flex h-full flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <span
                        className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--color-border)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg]"
                        style={{ color: `var(${tone})`, background: `color-mix(in srgb, var(${tone}) 10%, transparent)` }}
                      >
                        <Icon size={21} />
                      </span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]" dir="ltr">/{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-5 font-[var(--font-display)] text-lg leading-snug font-semibold text-[var(--color-text-primary)]">{service.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-text-muted)]">{service.description}</p>
                    {service.features?.length > 0 && (
                      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--color-border)] pt-4">
                        {service.features.slice(0, 3).map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                            <FiCheck className="mt-0.5 shrink-0" size={14} style={{ color: `var(${tone})` }} />{feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    {service.technologies?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {service.technologies.slice(0, 4).map((technology) => <span key={technology} className="ds-chip">{technology}</span>)}
                      </div>
                    )}
                    {service.startingPrice && <p className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">{t("pages.services.startingAt", { price: service.startingPrice })}</p>}
                    <Link to="/contact" className="mt-auto inline-flex items-center justify-between gap-3 pt-5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      <span>{service.ctaText || t("pages.services.defaultCta")}</span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-border)] transition-all duration-300 group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white">
                        <FiArrowUpRight className="rtl-flip transition-transform duration-300 group-hover:rotate-45" size={16} />
                      </span>
                    </Link>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
