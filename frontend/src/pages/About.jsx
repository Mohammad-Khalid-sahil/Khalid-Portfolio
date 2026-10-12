import { motion } from "framer-motion";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { FiDownload } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import PageHero from "@/components/common/PageHero";
import Statistics from "@/sections/about/Statistics";
import Button from "@/components/ui/Button";
import { useProfile } from "@/hooks/queries/useProfile";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { ErrorState } from "@/components/loaders/ErrorState";
import Seo, { buildBreadcrumbSchema } from "@/components/seo/Seo";
import ProfilePhoto from "@/components/common/ProfilePhoto";
import { DEFAULT_PROFILE_IMAGE } from "@/config/profileAssets";

export default function About() {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useProfile();

  if (isLoading) {
    return (
      <section className="container-page py-24">
        <SectionLoader label={t("pages.about.loading")} />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="container-page py-24">
        <ErrorState message={t("pages.about.error")} onRetry={refetch} />
      </section>
    );
  }

  return (
    <>
      <Seo
        title={t("pages.about.title")}
        description={t("pages.about.seo")}
        keywords={["Mohammad Khalid", "about software engineer", "full-stack developer background", "product engineer"]}
        path="/about"
        image={profile?.avatar}
        jsonLd={[buildBreadcrumbSchema([{ name: t("nav.home"), path: "/" }, { name: t("nav.about"), path: "/about" }])]}
      />
      <PageHero
        eyebrow={t("pages.about.eyebrow")}
        title={t("pages.about.title")}
        description={profile?.tagline || ""}
      />

      <section className="container-page py-16 md:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl shadow-black/10">
              <ProfilePhoto src={profile?.avatar || DEFAULT_PROFILE_IMAGE} name={profile?.name} alt={profile?.name} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent px-6 pb-6 pt-24 text-white">
                <p className="font-[var(--font-display)] text-xl font-semibold">{profile?.name}</p>
                <p className="mt-1 text-sm text-white/75">{profile?.title}</p>
              </div>
            </div>
            {(profile?.resumeUrl || DEFAULT_RESUME_URL) && (
              <Button href={profile?.resumeUrl || DEFAULT_RESUME_URL} download className="mt-6">
                {t("pages.about.download")} <FiDownload />
              </Button>
            )}
          </motion.div>

          <div className="space-y-6 text-[var(--color-text-muted)]">
            <p className="inline-flex rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">{t("pages.about.introduction")}</p>
            {profile?.bio ? (
              <p className="text-lg leading-8 text-[var(--color-text-secondary)]">{profile.bio}</p>
            ) : (
              <p className="leading-relaxed">{t("phase4.misc.aboutEmpty")}</p>
            )}

            {profile?.specialization && (
              <div className="border-t border-[var(--color-border)] pt-5">
                <p className="font-mono text-sm text-[var(--color-primary)]">{t("pages.about.specialization")}</p>
                <p className="mt-2 leading-relaxed">{profile.specialization}</p>
              </div>
            )}

            {profile?.careerGoals && (
              <div className="border-t border-[var(--color-border)] pt-5">
                <p className="font-mono text-sm text-[var(--color-primary)]">{t("pages.about.goals")}</p>
                <p className="mt-2 leading-relaxed">{profile.careerGoals}</p>
              </div>
            )}

            {profile?.interests?.length > 0 && (
              <div>
                <p className="font-mono text-sm text-[var(--color-primary)]">{t("pages.about.interests")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-primary)]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Statistics />
    </>
  );
}
