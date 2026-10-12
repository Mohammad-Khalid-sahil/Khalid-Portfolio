import { motion } from "framer-motion";
import { FiArrowRight, FiMail } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { navLinks } from "@/constants/siteData";
import SocialLinks from "@/components/common/SocialLinks";
import { PROFILE_SOCIAL_KEYS } from "@/config/socialLinks";
import BrandMark from "@/components/common/BrandMark";
import { useProfile } from "@/hooks/queries/useProfile";
import { cleanBrandName } from "@/utils/displayContent";


const MORE_LINKS = [
  { labelKey: "nav.services", to: "/services" },
  { labelKey: "nav.resume", to: "/resume" },
  { labelKey: "nav.testimonials", to: "/testimonials" },
  { labelKey: "nav.education", to: "/education" },
  { labelKey: "nav.certifications", to: "/certifications" },
];

const FALLBACK = {
  name: "Portfolio",
  tagline: "",
  social: {},
  email: "",
  phone: "",
  location: "",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Footer() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const p = { ...FALLBACK, ...profile, name: cleanBrandName(profile?.name) || FALLBACK.name };

  return (
    <footer className="relative overflow-hidden border-t border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-background)]">
      {/* Background decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute start-0 top-0 h-80 w-80 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute end-0 bottom-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
      </div>

      {/* Main footer content */}
      <motion.div 
        className="container-page grid gap-12 py-16 md:grid-cols-[1.3fr_0.8fr_0.8fr] md:py-24"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Brand section */}
        <motion.div variants={itemVariants}>
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}><BrandMark name="SH Software" size="lg" /></motion.div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--color-text-muted)]">{p.tagline}</p>
          
          {/* CTA Button */}
          <motion.a 
            href="/contact"
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-5 py-3 font-[var(--font-display)] text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all hover:shadow-xl hover:shadow-[var(--color-primary)]/35"
          >
            {t("nav.contact")} <FiArrowRight className="rtl-flip" aria-hidden="true" size={16} />
          </motion.a>

          {/* Social links */}
          <motion.div 
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <SocialLinks profile={p} platforms={PROFILE_SOCIAL_KEYS} showUnconfigured={false} size="md" className="gap-2.5" />
          </motion.div>
        </motion.div>

        {/* Navigation links */}
        <motion.div variants={itemVariants}>
          <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{t("footer.navigation")}</p>
          <ul className="mt-6 space-y-3">
            {navLinks.map((link, idx) => (
              <motion.li 
                key={link.to}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <a 
                  href={link.to} 
                  className="text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-300 hover:text-[var(--color-primary)]"
                >
                  {t(link.labelKey)}
                </a>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* More links & contact info */}
        <motion.div variants={itemVariants}>
          <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{t("footer.more")}</p>
          <ul className="mt-6 space-y-3">
            {MORE_LINKS.map((link, idx) => (
              <motion.li 
                key={link.to}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 + idx * 0.05 }}
              >
                <a 
                  href={link.to} 
                  className="text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-300 hover:text-[var(--color-primary)]"
                >
                  {t(link.labelKey)}
                </a>
              </motion.li>
            ))}
          </ul>

          {/* Contact details */}
          {(p.email || p.phone || p.location) && (
            <motion.div 
              className="mt-7 space-y-2 border-t border-[var(--color-border)] pt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {p.email && (
                <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                  <FiMail size={14} className="text-[var(--color-primary)]" />
                  {p.email}
                </p>
              )}
              {p.phone && <p className="text-sm text-[var(--color-text-muted)]">{p.phone}</p>}
              {p.location && <p className="text-sm text-[var(--color-text-muted)]">{p.location}</p>}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Footer bottom */}
      <motion.div 
        className="container-page py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <p className="flex flex-col items-center justify-center gap-3 text-center text-xs font-medium text-[var(--color-text-muted)] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {p.name}. {t("footer.built")}</span>
          <a 
            href="/admin/login" 
            className="text-[var(--color-text-muted)] transition-colors duration-300 hover:text-[var(--color-primary)]"
          >
            {t("admin.label")}
          </a>
        </p>
      </motion.div>
    </footer>
  );
}
