import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiArrowRight } from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { useTestimonials } from "@/hooks/queries/useTestimonials";
import SectionHeading from "@/components/ui/SectionHeading";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

export default function Testimonials() {
  const { t } = useTranslation();
  const { data: testimonials, isLoading, isError, refetch } = useTestimonials();
  const [index, setIndex] = useState(0);

  if (isLoading || isError || !testimonials?.length) {
    return (
      <section className="relative overflow-hidden bg-[var(--color-background)] py-24 sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute end-0 top-1/4 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
          <div className="absolute start-0 bottom-0 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        </div>
        <div className="container-page">
          <SectionHeading eyebrow={t("sections.testimonials.eyebrow")} title={t("sections.testimonials.title")} align="center" />
          <div className="mt-12">
            {isLoading && <SectionLoader label={t("pages.testimonials.loading")} />}
            {isError && <ErrorState message={t("pages.testimonials.error")} onRetry={refetch} />}
            {!isLoading && !isError && !testimonials?.length && (
              <p className="text-center text-[var(--color-text-muted)]">{t("pages.testimonials.empty")}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const currentIndex = Math.min(index, testimonials.length - 1);
  const current = testimonials[currentIndex];

  function next() {
    setIndex((i) => (Math.min(i, testimonials.length - 1) + 1) % testimonials.length);
  }
  function prev() {
    setIndex((i) => (Math.min(i, testimonials.length - 1) - 1 + testimonials.length) % testimonials.length);
  }

  return (
    <section className="relative overflow-hidden bg-[var(--color-background)] py-24 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute end-0 top-1/4 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
        <div className="absolute start-0 bottom-0 h-72 w-72 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_2%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_2%,transparent)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container-page">
        <SectionHeading eyebrow={t("sections.testimonials.eyebrow")} title={t("sections.testimonials.title")} align="center" />

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Testimonial card carousel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current._id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)] to-[var(--color-surface-muted)] p-8 shadow-lg sm:p-10 md:p-12"
              >
                {/* Quote mark icon */}
                <motion.div
                  className="absolute end-6 top-6 text-[var(--color-primary)]/10"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <FaQuoteLeft size={48} className="fill-current" />
                </motion.div>

                {/* Quote text */}
                <motion.blockquote
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative z-10"
                >
                  <p className="font-[var(--font-display)] text-2xl font-bold leading-relaxed text-[var(--color-text-primary)] md:text-3xl">
                    "{current.message}"
                  </p>
                </motion.blockquote>

                {/* Footer with author info */}
                <motion.footer
                  className="mt-8 flex items-center gap-4 border-t border-[var(--color-border)] pt-6 md:mt-10 md:pt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Avatar placeholder or icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                    {current.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-[var(--font-display)] font-bold text-[var(--color-text-primary)]">
                      {current.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {current.position && <span>{current.position}</span>}
                      {current.position && current.company && <span> · </span>}
                      {current.company && <span>{current.company}</span>}
                    </p>
                  </div>
                </motion.footer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation controls */}
          {testimonials.length > 1 && (
            <motion.div 
              className="mt-8 flex items-center justify-center gap-4 md:mt-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {/* Previous button */}
              <motion.button
                type="button"
                onClick={prev}
                aria-label={t("sections.testimonials.previous")}
                whileHover={{ scale: 1.1, backgroundColor: "var(--color-primary)" }}
                whileTap={{ scale: 0.95 }}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors duration-300 hover:border-[var(--color-primary)] hover:text-white"
              >
                <FiChevronLeft className="rtl-flip" size={18} />
              </motion.button>

              {/* Indicator dots */}
              <div className="flex items-center gap-2.5">
                {testimonials.map((item, i) => (
                  <motion.button
                    key={item._id}
                    onClick={() => setIndex(i)}
                    aria-label={t("sections.testimonials.goTo", { count: i + 1 })}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex 
                        ? "h-2.5 w-8 bg-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/30" 
                        : "h-2 w-2 bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]"
                    }`}
                  />
                ))}
              </div>

              {/* Next button */}
              <motion.button
                type="button"
                onClick={next}
                aria-label={t("sections.testimonials.next")}
                whileHover={{ scale: 1.1, backgroundColor: "var(--color-primary)" }}
                whileTap={{ scale: 0.95 }}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors duration-300 hover:border-[var(--color-primary)] hover:text-white"
              >
                <FiChevronRight className="rtl-flip" size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* Counter */}
          <motion.div 
            className="mt-6 text-center text-sm font-medium text-[var(--color-text-muted)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-[var(--color-primary)]">{currentIndex + 1}</span> of <span className="text-[var(--color-text-secondary)]">{testimonials.length}</span>
          </motion.div>

          {/* View all link */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-2 font-semibold text-[var(--color-primary)] transition-all duration-300 hover:gap-3"
            >
              {t("sections.testimonials.viewAll")} <FiArrowRight className="rtl-flip" size={15} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
