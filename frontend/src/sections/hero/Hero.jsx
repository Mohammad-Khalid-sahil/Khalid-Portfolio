import { useRef } from "react";
import { DEFAULT_RESUME_URL } from "@/config/profileAssets";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { FiArrowRight, FiDownload, FiMapPin, FiMail } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/queries/useProfile";
import { useSkills } from "@/hooks/queries/useSkills";
import ProfilePhoto from "@/components/common/ProfilePhoto";
import { DEFAULT_PROFILE_IMAGE } from "@/config/profileAssets";
import SocialLinks from "@/components/common/SocialLinks";
import { PROFILE_SOCIAL_KEYS } from "@/config/socialLinks";
import Button from "@/components/ui/Button";
import Marquee from "@/components/ui/Marquee";
import TechIcon from "@/components/ui/TechIcon";
import { ErrorState } from "@/components/loaders/ErrorState";
import Terminal from "@/sections/hero/Terminal";
import { cleanBrandName } from "@/utils/displayContent";

const EASE = [0.22, 1, 0.36, 1];
const CHIP_POSITIONS = [
  "-top-5 end-6 sm:end-10",
  "top-[42%] -start-3 sm:-start-8",
  "-bottom-5 end-[8%]",
];

export default function Hero() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: skills = [] } = useSkills();
  const displayName = cleanBrandName(profile?.name);
  const greetingText = t("hero.intro", { name: displayName });
  const greeting = (displayName ? greetingText.split(displayName)[0] : greetingText).replace(/[-–—]\s*$/, "").trim();
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const leadName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : displayName;
  const tailName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const sortedSkills = [...skills].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (b.level || 0) - (a.level || 0));
  const heroSkills = sortedSkills.slice(0, 3);

  // Pointer spotlight + subtle parallax for the visual column.
  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const spotlight = useMotionTemplate`radial-gradient(38rem circle at ${mx}% ${my}%, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent 60%)`;
  const tiltX = useSpring(useTransform(my, [0, 100], [4, -4]), { stiffness: 120, damping: 20 });
  const tiltY = useSpring(useTransform(mx, [0, 100], [-5, 5]), { stiffness: 120, damping: 20 });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0.2]);

  function handlePointerMove(event) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 100);
    my.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  const reveal = (delay = 0, distance = 22) => ({
    initial: reduce ? false : { opacity: 0, y: distance, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduce ? 0 : 0.9, delay: reduce ? 0 : delay, ease: EASE },
  });

  return (
    <section
      id="home"
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      className="relative isolate overflow-hidden pb-10 pt-8 md:pb-14 md:pt-14 lg:min-h-[calc(100svh-84px)]"
    >
      {/* Background composition */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="ds-grid ds-grid-fade absolute inset-0 opacity-80" />
        <motion.div className="absolute inset-0" style={{ background: spotlight }} />
        <div className="hero-ambient-orb hero-ambient-orb--primary absolute -top-40 start-[8%] h-[28rem] w-[28rem] rounded-full bg-[var(--color-primary)]/15 blur-[120px]" />
        <div className="hero-ambient-orb hero-ambient-orb--secondary absolute bottom-0 end-[-6rem] h-[24rem] w-[24rem] rounded-full bg-[var(--color-secondary)]/10 blur-[110px]" />
        <svg className="absolute inset-x-0 top-0 h-full w-full opacity-[0.35]" preserveAspectRatio="none" viewBox="0 0 1200 800" fill="none">
          <path d="M0 620 C 300 520, 420 760, 720 600 S 1100 420, 1200 480" stroke="url(#hero-line)" strokeWidth="1" />
          <path className="hero-flow-line" d="M0 680 C 260 600, 500 800, 780 660 S 1080 520, 1200 560" stroke="url(#hero-line)" strokeWidth="1" strokeDasharray="4 8" />
          <defs>
            <linearGradient id="hero-line" x1="0" x2="1200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--color-primary)" stopOpacity="0" />
              <stop offset="0.5" stopColor="var(--color-primary)" />
              <stop offset="1" stopColor="var(--color-secondary)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container-page relative grid w-full min-w-0 grid-cols-1 items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 xl:gap-20">
        {/* Copy column */}
        <motion.div style={{ opacity: copyOpacity }} className="relative w-full min-w-0 text-center lg:text-start">
          <motion.div {...reveal(0.05)} className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
            {profile?.availability && (
              <span className="ds-glass inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="ds-status-dot" />
                {t("hero.available")}
              </span>
            )}
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
                <FiMapPin size={12} className="text-[var(--color-primary)]" /> {profile.location}
              </span>
            )}
          </motion.div>

          <motion.p {...reveal(0.15)} className="mt-8 font-[var(--font-display)] text-base font-semibold tracking-wide text-[var(--color-primary)] sm:text-lg">
            {greeting}
          </motion.p>

          <h1 className="ds-display relative isolate mx-auto mt-3 w-full min-w-0 max-w-full text-[clamp(2.25rem,8.4vw,6.6rem)] font-bold leading-[1.08] text-[var(--color-text-primary)] sm:text-[clamp(2.9rem,8.4vw,6.6rem)] lg:mx-0">
            {isLoading ? (
              <span className="mx-auto block h-24 max-w-xl animate-pulse rounded-2xl bg-[var(--color-card)] lg:mx-0" />
            ) : displayName ? (
              <motion.span {...reveal(0.25, 30)} className="relative isolate z-10 block max-w-full break-words [overflow-wrap:anywhere]">
                <span aria-hidden="true" className="hero-name-aura pointer-events-none absolute inset-x-[-8%] inset-y-[8%] z-0" />
                <span className="relative z-10">
                  {leadName}
                  {tailName && <> <span className="ds-gradient-text">{tailName}</span></>}
                  <span className="text-[var(--color-primary)]">.</span>
                </span>
              </motion.span>
            ) : (
              <span className="text-3xl font-semibold">{t("phase4.misc.heroEmpty")}</span>
            )}
          </h1>

          {profile?.title && (
            <motion.p {...reveal(0.38)} className="mt-5 flex min-w-0 max-w-full flex-wrap items-center justify-center gap-3 font-[var(--font-display)] text-[clamp(1.2rem,2.3vw,1.8rem)] font-semibold leading-tight tracking-tight lg:justify-start">
              <span aria-hidden="true" className="hidden h-px w-10 bg-gradient-to-r from-[var(--color-primary)] to-transparent sm:block rtl:bg-gradient-to-l" />
              <span className="ds-gradient-text min-w-0 max-w-full break-words">{profile.title}</span>
            </motion.p>
          )}

          {profile?.tagline && (
            <motion.p {...reveal(0.48)} className="mx-auto mt-6 w-full min-w-0 max-w-xl text-pretty text-base leading-8 text-[var(--color-text-muted)] sm:text-lg lg:mx-0">
              {profile.tagline}
            </motion.p>
          )}
          {isError && <div className="mt-5"><ErrorState message={t("pages.about.error")} onRetry={refetch} /></div>}

          <motion.div {...reveal(0.58)} className="mt-10 flex w-full min-w-0 flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
            <Button href="/projects" size="lg" magnetic>
              {t("hero.viewWork")} <FiArrowRight className="rtl-flip transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Button>
            {(profile?.resumeUrl || DEFAULT_RESUME_URL) && (
              <Button href={profile?.resumeUrl || DEFAULT_RESUME_URL} download variant="outline" size="lg">
                <FiDownload /> {t("hero.downloadCv")}
              </Button>
            )}
            <Button href="/contact" variant="ghost" size="lg">
              <FiMail /> {t("nav.contact")}
            </Button>
          </motion.div>

          <motion.div {...reveal(0.7)} className="mt-8 flex w-full min-w-0 flex-wrap items-center justify-center gap-3 lg:justify-start">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)] rtl:tracking-normal">{t("hero.socialLabel")}</span>
            <span aria-hidden="true" className="h-px w-8 bg-[var(--color-border)]" />
            <SocialLinks profile={profile} platforms={PROFILE_SOCIAL_KEYS} showUnconfigured={false} size="md" className="gap-2.5" />
          </motion.div>
        </motion.div>

        {/* Visual column: terminal + profile card + floating stack chips */}
        <motion.div
          style={{ y: visualY }}
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.3, ease: EASE }}
          className="relative mx-auto w-full min-w-0 max-w-[34rem] [perspective:1400px]"
        >
          <motion.div style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY }} className="relative [transform-style:preserve-3d]">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-primary)_22%,transparent),transparent)] blur-2xl" />

            {/* Profile identity card */}
            <div className="ds-card relative overflow-hidden p-5 sm:p-6">
              <div aria-hidden="true" className="ds-dots absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
              <div className="relative flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                  <div aria-hidden="true" className="ds-orbit absolute -inset-1.5 rounded-[1.6rem] bg-[conic-gradient(from_0deg,var(--color-primary),transparent_40%,var(--color-secondary),transparent_80%,var(--color-primary))] opacity-80" />
                  <div className="absolute inset-0 overflow-hidden rounded-[1.4rem] border-2 border-[var(--color-card)] bg-[var(--color-surface-muted)]">
                    <ProfilePhoto src={profile?.avatar || DEFAULT_PROFILE_IMAGE} name={profile?.name} alt={profile?.name} className="text-2xl" />
                  </div>
                </div>
                <div className="min-w-0 text-start">
                  <p className="truncate font-[var(--font-display)] text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">{displayName || t("hero.fallbackName")}</p>
                  {profile?.title && <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{profile.title}</p>}
                  {profile?.availability && (
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 font-mono text-[0.68rem] text-[var(--color-accent)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {t("ui.openToWork")}
                    </p>
                  )}
                </div>
              </div>
              {heroSkills.length > 0 && (
                <div className="relative mt-5 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
                  <span className="me-1 self-center font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--color-text-muted)] rtl:tracking-normal">{t("ui.primaryStack")}</span>
                  {sortedSkills.slice(0, 5).map((skill) => (
                    <span key={skill._id || skill.name} className="ds-chip"><TechIcon name={skill.name} category={skill.category} size={12} className="text-[var(--color-primary)]" />{skill.name}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Terminal window, offset for depth */}
            <div className="relative z-0 -mt-3 ms-6 w-[calc(100%-1.5rem)] sm:ms-14 sm:w-[calc(100%-3.5rem)]">
              <Terminal />
            </div>

            {/* Floating technology chips (real skills only) */}
            {heroSkills.map((skill, index) => (
              <motion.span
                key={skill._id || skill.name}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: reduce ? 0 : 1 + index * 0.18, duration: 0.6, ease: EASE }}
                className={`absolute z-30 hidden sm:block ${CHIP_POSITIONS[index]}`}
              >
                <span className={`ds-glass ds-float ${index % 2 ? "ds-float--delay" : ""} flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--ds-shadow-md)]`}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                    <TechIcon name={skill.name} category={skill.category} size={15} />
                  </span>
                  {skill.name}
                </span>
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Technology marquee from real skill data */}
      {sortedSkills.length > 3 && (
        <motion.div {...reveal(0.9, 10)} className="container-page relative mt-16 md:mt-20">
          <p className="mb-4 text-center font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)] rtl:tracking-normal">{t("ui.techStack")}</p>
          <Marquee duration={Math.max(28, sortedSkills.length * 3)}>
            {sortedSkills.map((skill) => (
              <span key={skill._id || skill.name} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_60%,transparent)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)]">
                <TechIcon name={skill.name} category={skill.category} size={16} className="text-[var(--color-text-muted)]" />
                {skill.name}
              </span>
            ))}
          </Marquee>
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })}
        {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1.6 } })}
        className="mx-auto mt-10 hidden flex-col items-center gap-2 bg-transparent text-[var(--color-text-muted)] transition-colors hover:bg-transparent hover:text-[var(--color-primary)] lg:flex"
        aria-label={t("ui.scrollDown")}
      >
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] rtl:tracking-normal">{t("hero.scrollLabel")}</span>
        <span className="grid h-9 w-6 place-items-start justify-center rounded-full border border-[var(--color-border)] pt-1.5">
          <motion.span animate={reduce ? undefined : { y: [0, 10, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="h-1.5 w-1 rounded-full bg-[var(--color-primary)]" />
        </span>
      </motion.button>
    </section>
  );
}
