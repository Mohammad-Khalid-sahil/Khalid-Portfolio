import { motion } from "framer-motion";

export default function PageHero({ eyebrow, title, description }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-primary)_4%,transparent)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-page py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          {eyebrow && <p className="inline-flex items-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">{eyebrow}</p>}
          <h1 className="mt-5 font-[var(--font-display)] text-4xl font-bold leading-tight text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description && <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--color-text-muted)] sm:text-lg">{description}</p>}
        </motion.div>
      </div>
    </section>
  );
}
