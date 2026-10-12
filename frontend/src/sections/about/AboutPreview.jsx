import { motion, useReducedMotion } from "framer-motion";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { FiArrowRight, FiBriefcase, FiCode, FiMapPin, FiBookOpen, FiHeart, FiTarget, FiMessageCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { rise, stagger } from "@/components/ui/Reveal";
import ProfilePhoto from "@/components/common/ProfilePhoto";
import { DEFAULT_PROFILE_IMAGE } from "@/config/profileAssets";
import { useProfile } from "@/hooks/queries/useProfile";
import { useEducationList } from "@/hooks/queries/useCareer";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Statistics from "@/sections/about/Statistics";

function CardLabel({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--color-text-muted)] rtl:tracking-normal">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Icon size={14} /></span>
      {children}
    </p>
  );
}

export default function AboutPreview() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: education } = useEducationList();
  const latestEducation = education?.[0];
  const languages = (profile?.languages || []).filter((language) => language?.name);
  const interests = profile?.interests || [];

  return (
    <section id="about" className="ds-section overflow-hidden">
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading index="01" eyebrow={t("sections.about.eyebrow")} title={t("sections.about.title")} maxWidth="max-w-3xl" />
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/about" variant="outline">{t("sections.about.cta")} <FiArrowRight className="rtl-flip" /></Button>
          </div>
        </div>

        {isLoading && <div className="mt-10"><SectionLoader label={t("pages.about.loading")} /></div>}
        {isError && <div className="mt-10"><ErrorState message={t("pages.about.error")} onRetry={refetch} /></div>}

        {!isLoading && !isError && (
          <motion.div
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger(0.05, 0.08)}
            className="mt-14 grid auto-rows-[minmax(0,auto)] gap-4 md:grid-cols-6 lg:grid-cols-12 lg:gap-5"
          >
            {/* Identity card */}
            <motion.div variants={rise} className="md:col-span-6 lg:col-span-5 lg:row-span-2">
              <SpotlightCard className="flex h-full flex-col p-3">
                <div className="relative aspect-[4/3.6] overflow-hidden rounded-[1.15rem] bg-[var(--color-surface-muted)]">
                  <ProfilePhoto src={profile?.avatar || DEFAULT_PROFILE_IMAGE} name={profile?.name} alt={profile?.name} className="text-6xl" />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-transparent" />
                  {profile?.availability && (
                    <span className="ds-glass absolute start-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                      <span className="ds-status-dot" /> {t("hero.available")}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                  <h3 className="ds-display text-2xl font-bold text-[var(--color-text-primary)] sm:text-[1.75rem]">{profile?.name}</h3>
                  {profile?.title && <p className="mt-1.5 font-medium text-[var(--color-primary)]">{profile.title}</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {profile?.location && <span className="ds-chip"><FiMapPin size={12} className="text-[var(--color-primary)]" />{profile.location}</span>}
                    {profile?.specialization && <span className="ds-chip"><FiCode size={12} className="text-[var(--color-secondary)]" />{profile.specialization}</span>}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <Button href="/contact" size="sm">{t("sections.cta.button")} <FiArrowRight className="rtl-flip" /></Button>
                    {(profile?.resumeUrl || DEFAULT_RESUME_URL) && <Button href={profile?.resumeUrl || DEFAULT_RESUME_URL} download variant="outline" size="sm">{t("pages.about.download")}</Button>}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Bio */}
            <motion.div variants={rise} className="md:col-span-6 lg:col-span-7">
              <SpotlightCard className="h-full p-7 sm:p-9">
                <CardLabel icon={FiMessageCircle}>{t("pages.about.introduction")}</CardLabel>
                {profile?.specialization && (
                  <h3 className="ds-display mt-6 text-balance text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl">{profile.specialization}</h3>
                )}
                <div className="mt-5 space-y-4 text-pretty text-base leading-8 text-[var(--color-text-muted)]">
                  {profile?.bio ? <p>{profile.bio}</p> : <p>{t("phase4.misc.summaryEmpty")}</p>}
                </div>
              </SpotlightCard>
            </motion.div>

            {/* Career goals / focus */}
            {profile?.careerGoals && (
              <motion.div variants={rise} className={`md:col-span-3 ${latestEducation ? "lg:col-span-4" : "lg:col-span-7"}`}>
                <SpotlightCard className="h-full p-6 sm:p-7">
                  <CardLabel icon={FiTarget}>{t("ui.focus")}</CardLabel>
                  <p className="mt-5 text-sm leading-7 text-[var(--color-text-secondary)]">{profile.careerGoals}</p>
                </SpotlightCard>
              </motion.div>
            )}

            {/* Latest education */}
            {latestEducation && (
              <motion.div variants={rise} className={`md:col-span-3 ${profile?.careerGoals ? "lg:col-span-3" : "lg:col-span-7"}`}>
                <SpotlightCard className="h-full p-6 sm:p-7">
                  <CardLabel icon={FiBookOpen}>{t("nav.education")}</CardLabel>
                  <p className="mt-5 font-[var(--font-display)] text-lg font-semibold leading-snug text-[var(--color-text-primary)]">{latestEducation.degree}</p>
                  <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{latestEducation.university}</p>
                </SpotlightCard>
              </motion.div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <motion.div variants={rise} className={`md:col-span-6 ${languages.length ? "lg:col-span-8" : "lg:col-span-12"}`}>
                <SpotlightCard className="h-full p-6 sm:p-7">
                  <CardLabel icon={FiHeart}>{t("pages.about.interests")}</CardLabel>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {interests.map((interest) => (
                      <span key={interest} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </SpotlightCard>
              </motion.div>
            )}

            {/* Spoken languages */}
            {languages.length > 0 && (
              <motion.div variants={rise} className={`md:col-span-6 ${interests.length ? "lg:col-span-4" : "lg:col-span-12"}`}>
                <SpotlightCard className="h-full p-6 sm:p-7">
                  <CardLabel icon={FiBriefcase}>{t("ui.languages")}</CardLabel>
                  <ul className="mt-5 space-y-3">
                    {languages.map((language) => (
                      <li key={language._id || language.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-[var(--color-text-secondary)]">{language.name}</span>
                        {language.level && <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 font-mono text-[0.68rem] text-[var(--color-text-muted)]">{language.level}</span>}
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      <Statistics embedded />
    </section>
  );
}
