import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiSend, FiGithub, FiLinkedin, FiFacebook, FiInstagram, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import { useProfile } from "@/hooks/queries/useProfile";
import { sendContactMessage } from "@/services/contactService";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";

const SOCIAL_ICONS = {
  github: FiGithub,
  linkedin: FiLinkedin,
  telegram: FiSend,
  facebook: FiFacebook,
  instagram: FiInstagram,
};

export default function Contact() {
  const { t } = useTranslation();
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, refetch: refetchProfile } = useProfile();
  const p = profile || {};
  const [justSent, setJustSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(data) {
    try {
      await sendContactMessage(data);
      toast.success(t("pages.contact.success"));
      setJustSent(true);
      reset();
    } catch (error) {
      setJustSent(false);
      toast.error(error.message || t("pages.contact.error"));
    }
  }

  return (
    <>
      <Seo
        title={t("pages.contact.title")}
        description={t("pages.contact.seo")}
        keywords={["contact full-stack developer", "hire software engineer", "freelance developer"]}
        path="/contact"
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.contact"), path: "/contact" }])]}
      />
      <PageHero
        eyebrow={t("pages.contact.eyebrow")}
        title={t("pages.contact.heroTitle")}
        description={t("pages.contact.heroDescription")}
      />

      <section className="container-page grid items-start gap-12 py-20 md:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Contact Info Sidebar */}
        <motion.div 
          className="space-y-8 lg:sticky lg:top-28"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {isProfileLoading && <SectionLoader label={t("common.loading")} />}
          {isProfileError && <ErrorState message={t("pages.contact.error")} onRetry={refetchProfile} />}
          {!isProfileLoading && !isProfileError && (
            <>
              {/* Direct Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">{t("pages.contact.direct")}</p>
                <div className="mt-6 space-y-3">
                  {p.email && (
                    <motion.a
                      href={`mailto:${p.email}`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] px-5 py-4 text-[var(--color-text-secondary)] transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                        <FiMail size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-[var(--color-text-muted)]">Email</p>
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{p.email}</p>
                      </div>
                      <FiArrowRight className="rtl-flip shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1" />
                    </motion.a>
                  )}
                  {p.phone && (
                    <motion.a
                      href={`tel:${p.phone}`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] px-5 py-4 text-[var(--color-text-secondary)] transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                        <FiPhone size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-[var(--color-text-muted)]">Phone</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.phone}</p>
                      </div>
                      <FiArrowRight className="rtl-flip shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1" />
                    </motion.a>
                  )}
                  {p.location && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] px-5 py-4 text-[var(--color-text-secondary)]"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                        <FiMapPin size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-[var(--color-text-muted)]">Location</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.location}</p>
                      </div>
                    </motion.div>
                  )}
                  {!p.email && !p.phone && !p.location && (
                    <p className="text-sm text-[var(--color-text-muted)]">{t("phase4.misc.contactEmpty")}</p>
                  )}
                </div>
              </motion.div>

              {/* Social Links */}
              {Object.entries(p.social || {}).some(([, url]) => url) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">{t("pages.contact.social")}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {Object.entries(p.social || {}).map(([key, url], idx) => {
                      const Icon = SOCIAL_ICONS[key];
                      if (!url || !Icon) return null;
                      return (
                        <motion.a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={key}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.25 + idx * 0.05 }}
                          whileHover={{ scale: 1.15, y: -4 }}
                          className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/10"
                        >
                          <Icon size={18} />
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Availability Status */}
              {p.availability && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-3 rounded-full border border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-secondary)]"
                >
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-secondary)]" />
                  {t("pages.contact.available")}
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Contact Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="relative space-y-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)] to-[var(--color-surface-muted)] p-8 shadow-xl shadow-[var(--color-primary)]/10 md:p-10"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Background decoration */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute end-0 top-0 h-64 w-64 rounded-full bg-[var(--color-secondary)]/5 blur-3xl" />
          </div>

          {/* Honeypot field */}
          <input type="text" tabIndex="-1" autoComplete="off" className="hidden" {...register("website")} />

          {/* Success message */}
          {justSent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/10 px-4 py-3.5 text-sm font-medium text-[var(--color-secondary)]"
            >
              <FiCheckCircle size={18} />
              {t("pages.contact.sent")}
            </motion.div>
          )}

          {/* Name and Email fields */}
          <div className="grid gap-6 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="contact-name" className="mb-2.5 block font-[var(--font-display)] text-sm font-bold text-[var(--color-text-primary)]">
                {t("pages.contact.name")}
              </label>
              <input
                id="contact-name"
                {...register("name", { required: t("validation.nameRequired") })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                placeholder={t("pages.contact.namePlaceholder")}
              />
              {errors.name && <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{errors.name.message}</p>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <label htmlFor="contact-email" className="mb-2.5 block font-[var(--font-display)] text-sm font-bold text-[var(--color-text-primary)]">
                {t("pages.contact.email")}
              </label>
              <input
                id="contact-email"
                type="email"
                dir="ltr"
                {...register("email", {
                  required: t("validation.emailRequired"),
                  pattern: { value: /^\S+@\S+\.\S+$/, message: t("validation.emailInvalid") },
                })}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                placeholder={t("pages.contact.emailPlaceholder")}
              />
              {errors.email && <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{errors.email.message}</p>}
            </motion.div>
          </div>

          {/* Subject field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="contact-subject" className="mb-2.5 block font-[var(--font-display)] text-sm font-bold text-[var(--color-text-primary)]">
              {t("pages.contact.subject")}
            </label>
            <input
              id="contact-subject"
              {...register("subject", { required: t("validation.subjectRequired") })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              placeholder={t("pages.contact.subjectPlaceholder")}
            />
            {errors.subject && <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{errors.subject.message}</p>}
          </motion.div>

          {/* Message field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
          >
            <label htmlFor="contact-message" className="mb-2.5 block font-[var(--font-display)] text-sm font-bold text-[var(--color-text-primary)]">
              {t("pages.contact.message")}
            </label>
            <textarea
              id="contact-message"
              rows={6}
              {...register("message", {
                required: t("validation.messageRequired"),
                minLength: { value: 10, message: t("validation.messageMin") },
              })}
              className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              placeholder={t("pages.contact.messagePlaceholder")}
            />
            {errors.message && <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{errors.message.message}</p>}
          </motion.div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-6 py-3.5 font-[var(--font-display)] text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-primary)]/35 disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                  {t("pages.contact.sending")}
                </>
              ) : (
                <>
                  {t("pages.contact.send")}
                  <FiSend className="rtl-flip" size={16} />
                </>
              )}
            </span>
          </motion.button>
        </motion.form>
      </section>
    </>
  );
}
