import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import Button from "@/components/ui/Button";

/**
 * Placeholder for pages scheduled for a later build phase
 * (About, Skills, Projects, Experience, Blog, Contact — full versions).
 */
export default function ComingSoon({ title }) {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="font-mono text-sm text-[var(--color-primary)]">{"// phase 2"}</p>
        <h1 className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
          {title} page — coming in the next build phase
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[var(--color-text-muted)]">
          This route is wired up and ready; the full page will be built in the next step.
        </p>
        <Button href="/" className="mt-8">
          <FiArrowLeft className="rtl-flip" /> Back to Home
        </Button>
      </motion.div>
    </section>
  );
}
