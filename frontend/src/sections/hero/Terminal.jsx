import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/queries/useProfile";
import { useSkills } from "@/hooks/queries/useSkills";

const TYPE_SPEED = 45;
const LINE_PAUSE = 550;

/**
 * Animated terminal fed by real profile + skills data.
 * `bare` renders only the terminal body so it can live inside another
 * window frame (the hero code editor uses it as its second tab).
 */
export default function Terminal({ bare = false }) {
  const { t } = useTranslation();
  const { data: profile, isLoading: loadingProfile, isError: profileError } = useProfile();
  const { data: skills, isLoading: loadingSkills, isError: skillsError } = useSkills();
  const dataReady = !loadingProfile && !loadingSkills;
  const lines = useMemo(() => {
    const skillNames = Array.isArray(skills) ? skills.map((skill) => skill.name).filter(Boolean) : [];
    const shownSkills = skillNames.slice(0, 7);
    if (skillNames.length > shownSkills.length) shownSkills.push(t("terminal.more", { count: skillNames.length - shownSkills.length }));

    return [
      {
        prompt: "whoami",
        output: profileError ? t("terminal.profileUnavailable") : [profile?.name, profile?.title].filter(Boolean).join(" — ") || t("terminal.profileMissing"),
      },
      {
        prompt: "skills --list",
        output: skillsError ? t("terminal.skillsUnavailable") : shownSkills.join(" · ") || t("terminal.noSkills"),
      },
      {
        prompt: "status",
        output: profileError ? t("terminal.availabilityUnavailable") : profile ? (profile.availability ? t("hero.available") : t("terminal.notAvailable")) : t("terminal.profileMissing"),
      },
    ];
  }, [profile, profileError, skills, skillsError, t]);

  const [lineIndex, setLineIndex] = useState(0);
  const [typedPrompt, setTypedPrompt] = useState("");
  const [outputLineIndex, setOutputLineIndex] = useState(-1);

  useEffect(() => {
    if (!dataReady || lineIndex >= lines.length) return undefined;
    const current = lines[lineIndex];
    let charIndex = 0;
    let outputTimer;
    let lineTimer;
    const typeTimer = setInterval(() => {
      charIndex += 1;
      setTypedPrompt(current.prompt.slice(0, charIndex));
      if (charIndex >= current.prompt.length) {
        clearInterval(typeTimer);
        outputTimer = setTimeout(() => setOutputLineIndex(lineIndex), 200);
        lineTimer = setTimeout(() => {
          setLineIndex((prev) => prev + 1);
        }, LINE_PAUSE);
      }
    }, TYPE_SPEED);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(outputTimer);
      clearTimeout(lineTimer);
    };
  }, [dataReady, lineIndex, lines]);

  const isTyping = dataReady && lineIndex < lines.length;
  const userLabel = profile?.name?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_") || "portfolio";

  const body = (
    <div className="min-h-[13.5rem] p-5 text-start font-mono text-[0.8rem] leading-relaxed sm:text-[0.84rem]">
      {!dataReady && <p className="text-[var(--color-text-muted)]">{t("phase4.misc.loadingPortfolio")}</p>}
      {lines.slice(0, lineIndex).map((line, i) => (
        <div key={`${line.prompt}-${i}`} className="mb-3">
          <p className="text-[var(--color-text-muted)]" dir="ltr"><span className="text-[var(--color-success)]">➜</span> <span className="text-[var(--color-accent)]">~</span> <span className="text-[var(--color-text-primary)]">{line.prompt}</span></p>
          <p className="mt-1 break-words text-[var(--color-text-secondary)]">{line.output}</p>
        </div>
      ))}
      {isTyping && (
        <div>
          <p className="text-[var(--color-text-muted)]" dir="ltr">
            <span className="text-[var(--color-success)]">➜</span> <span className="text-[var(--color-accent)]">~</span> <span className="text-[var(--color-text-primary)]">{typedPrompt}</span>
            <span className="ms-0.5 inline-block h-4 w-2 animate-pulse bg-[var(--color-primary)] align-middle" />
          </p>
          {outputLineIndex === lineIndex && <p className="mt-1 break-words text-[var(--color-text-secondary)]">{lines[lineIndex].output}</p>}
        </div>
      )}
      {dataReady && !isTyping && (
        <p className="text-[var(--color-text-muted)]" dir="ltr"><span className="text-[var(--color-success)]">➜</span> <span className="text-[var(--color-accent)]">~</span> <span className="ms-0.5 inline-block h-4 w-2 animate-pulse bg-[var(--color-primary)] align-middle" /></p>
      )}
    </div>
  );

  if (bare) return body;

  return (
    <div className="ds-window w-full">
      <div className="ds-window__bar" dir="ltr">
        <span className="ds-window__dot bg-[#ff5f57]" />
        <span className="ds-window__dot bg-[#febc2e]" />
        <span className="ds-window__dot bg-[#28c840]" />
        <span className="ms-3 truncate font-mono text-[0.7rem] text-[var(--color-text-muted)]">{userLabel}@portfolio: ~</span>
        <span className="ms-auto hidden font-mono text-[0.65rem] text-[var(--color-text-muted)] sm:inline" aria-hidden="true">zsh</span>
      </div>

      {body}
    </div>
  );
}
