import { motion, useReducedMotion } from "framer-motion";

export default function PageHero({ eyebrow, title, description, id }) {
  const reduceMotion = useReducedMotion();

  return (
    <section id={id} className="ds-page-hero relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 start-1/2 h-80 w-[min(80vw,52rem)] -translate-x-1/2 rounded-full bg-[var(--color-primary)]/[0.08] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_4%,transparent)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>
      <div className="container-page py-14 sm:py-16 md:py-20">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          {eyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-card)]/80 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-sm backdrop-blur">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_12px_var(--color-primary)]" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-5 font-[var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-4xl md:text-5xl lg:text-[3.5rem]">
            {title}
          </h1>
          <span aria-hidden="true" className="mx-auto mt-5 block h-1 w-14 rounded-full bg-[var(--color-primary)] shadow-[0_0_18px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]" />
          {description && <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-7 text-[var(--color-text-muted)] sm:text-base sm:leading-8">{description}</p>}
        </motion.div>
      </div>
    </section>
  );
}
