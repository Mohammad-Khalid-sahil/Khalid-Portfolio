import { motion, useReducedMotion } from "framer-motion";

/**
 * Section header: numbered mono eyebrow, display title, optional description.
 * API is unchanged (eyebrow/title/description/align/maxWidth/…); `index` is an
 * optional visual counter such as "01".
 */
export default function SectionHeading({ eyebrow, title, description, index, align = "left", maxWidth = "max-w-2xl", titleClassName = "", descriptionClassName = "", children }) {
  const reduce = useReducedMotion();
  const centered = align === "center";
  const alignment = centered ? "items-center text-center mx-auto" : "items-start text-start";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col gap-4 ${maxWidth} ${alignment}`}
    >
      {eyebrow && (
        <span className="ds-eyebrow">
          {index && <span className="ds-eyebrow__index">{index}</span>}
          <span>{eyebrow}</span>
          {!centered && <span aria-hidden="true" className="ds-eyebrow__rule" />}
        </span>
      )}
      <h2 className={`ds-section-title ${centered ? "ds-section-title--centered" : ""} ds-display text-balance text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl ${titleClassName}`}>
        {title}
      </h2>
      {description && <p className={`text-pretty text-[0.95rem] leading-relaxed text-[var(--color-text-muted)] sm:text-base ${descriptionClassName}`}>{description}</p>}
      {children}
    </motion.div>
  );
}
