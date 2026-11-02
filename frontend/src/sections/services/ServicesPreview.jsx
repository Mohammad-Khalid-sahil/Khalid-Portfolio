import { FiArrowRight, FiArrowUpRight, FiCheck, FiCode, FiSmartphone, FiServer, FiDatabase } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useServiceOfferings } from "@/hooks/queries/useServiceOfferings";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import ExperienceTimeline from "@/components/common/ExperienceTimeline";

const ICONS = { FiCode, FiSmartphone, FiServer, FiDatabase };
const TONES = ["--color-primary", "--color-secondary", "--color-accent"];
export default function ServicesPreview() {
  const { t } = useTranslation();
  const { data: services, isLoading, isError, refetch } = useServiceOfferings();

  return (
    <section id="services" className="ds-section scroll-mt-20 overflow-hidden">
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
          <ExperienceTimeline items={services.slice(0, 4)} className="mt-14" getMeta={(service, index) => service.startingPrice ? t("pages.services.startingAt", { price: service.startingPrice }) : `/${String(index + 1).padStart(2, "0")}`} renderItem={(service, index) => {
              const Icon = ICONS[service.icon] || FiCode;
              const tone = TONES[index % TONES.length];
              return (
                <div className="h-full">
                  <SpotlightCard as="article" className="ds-experience-card group flex h-full flex-col overflow-hidden p-0">
                    <header className="flex items-start gap-4 border-b border-[var(--color-border)] p-6 sm:p-7">
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg]"
                        style={{ color: `var(${tone})`, background: `color-mix(in srgb, var(${tone}) 10%, transparent)` }}
                      >
                        <Icon size={21} />
                      </span>
                      <h3 className="min-w-0 flex-1 font-[var(--font-display)] text-xl font-bold text-[var(--color-text-primary)]">{service.title}</h3>
                    </header>
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <p className="mt-3 line-clamp-3 min-h-[5.25rem] text-sm leading-7 text-[var(--color-text-muted)]">{service.description}</p>
                    {service.features?.length > 0 && (
                      <ul className="mt-6 space-y-2.5 border-t border-[var(--color-border)] pt-5">
                        {service.features.slice(0, 2).map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                            <FiCheck className="mt-0.5 shrink-0" size={14} style={{ color: `var(${tone})` }} />{feature}
                          </li>
                        ))}
                      </ul>
                    )}
                    {service.technologies?.length > 0 && (
                      <div className="mt-6 flex max-h-8 flex-wrap gap-1.5 overflow-hidden">
                        {service.technologies.slice(0, 3).map((technology) => <span key={technology} className="ds-chip">{technology}</span>)}
                      </div>
                    )}
                    {service.startingPrice && <p className="mt-6 text-sm font-semibold text-[var(--color-text-primary)]">{t("pages.services.startingAt", { price: service.startingPrice })}</p>}
                    <Link to="/contact" className="mt-auto inline-flex items-center justify-between gap-3 pt-7 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      <span>{service.ctaText || t("pages.services.defaultCta")}</span>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] transition-all duration-300 group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white">
                        <FiArrowUpRight className="rtl-flip transition-transform duration-300 group-hover:rotate-45" size={16} />
                      </span>
                    </Link>
                    </div>
                  </SpotlightCard>
                </div>
              );
            }} />
        )}
      </div>
    </section>
  );
}
