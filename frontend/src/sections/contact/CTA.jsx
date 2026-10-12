import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/Button";

export default function CTA() {
  const { t } = useTranslation();
  return (
    <section id="contact" className="container-page pb-24">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-8 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 start-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[var(--color-primary)] opacity-[0.12] blur-[100px]"
        />
        <p className="font-mono text-sm text-[var(--color-primary)]">{t("sections.cta.eyebrow")}</p>
        <h2 className="mx-auto mt-3 max-w-xl font-[var(--font-display)] text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
          {t("sections.cta.title")}
        </h2>
        <Button href="/contact" className="mt-8">
          {t("sections.cta.button")} <FiArrowRight className="rtl-flip" />
        </Button>
      </div>
    </section>
  );
}
