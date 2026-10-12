import { FiGithub, FiStar, FiUsers, FiCode, FiRefreshCw } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { SectionLoader } from "@/components/loaders/SectionLoader";
import { useGithubProfile, useGithubRepos } from "@/hooks/queries/useGithub";
import { useProfile } from "@/hooks/queries/useProfile";
import { resolveGithubProfileUrl } from "@/config/socialLinks";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RepoRow({ repo, t }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      className="block border-b border-[var(--color-border)] py-4 last:border-b-0 hover:text-[var(--color-primary)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[var(--font-display)] text-base font-semibold text-[var(--color-text-primary)]">{repo.name}</p>
          {repo.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{repo.description}</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-[var(--color-text-muted)]">
          <FiStar size={12} /> {repo.stars}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-[var(--color-text-muted)]">
        {repo.language && <span>{repo.language}</span>}
        <span>{t("sections.github.forks", { count: repo.forks })}</span>
        <span>{t("sections.github.updated", { date: formatDate(repo.updatedAt) })}</span>
      </div>
    </a>
  );
}

export default function GitHubActivity() {
  const { t } = useTranslation();
  const profileQuery = useGithubProfile();
  const reposQuery = useGithubRepos(8);
  const { data: portfolioProfile } = useProfile();
  const profile = profileQuery.data?.profile;
  const reposData = reposQuery.data;
  const featured = reposData?.featured?.length ? reposData.featured : reposData?.repos?.slice(0, 3);
  const languageEntries = Object.entries(reposData?.languages || {}).slice(0, 6);
  const isLoading = profileQuery.isLoading || reposQuery.isLoading;
  const isError = profileQuery.isError || reposQuery.isError;
  const isRetrying = profileQuery.isFetching || reposQuery.isFetching;
  const requestError = profileQuery.error || reposQuery.error;
  const githubProfileUrl = resolveGithubProfileUrl(portfolioProfile);
  const profileLink = (
    <Button href={githubProfileUrl} target="_blank" rel="noopener noreferrer" aria-label={t("sections.github.viewProfile")} variant="ghost">
      {t("sections.github.viewProfile")} <FiGithub aria-hidden="true" />
    </Button>
  );

  if (isError) {
    return (
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-20 md:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow={t("sections.github.eyebrow")} title={t("sections.github.title")} />
            {profileLink}
          </div>
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <p className="text-sm text-[var(--color-text-muted)]">
              {requestError?.status === 429 ? t("sections.github.rateLimited") : t("sections.github.unavailable")}
            </p>
            <button
              type="button"
              onClick={() => {
                profileQuery.refetch();
                reposQuery.refetch();
              }}
              disabled={isRetrying}
              className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-[var(--color-primary)] hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              <FiRefreshCw size={12} className={isRetrying ? "animate-spin" : ""} /> {isRetrying ? t("sections.github.loading") : t("common.retry")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-20 md:py-24">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={t("sections.github.eyebrow")}
            title={t("sections.github.title")}
            description={t("sections.github.description")}
          />
          {profileLink}
        </div>

        {isLoading ? (
          <div className="mt-10">
            <SectionLoader label={t("sections.github.loading")} />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              {profile?.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt={profile?.name ? `${profile.name} avatar` : t("sections.github.title")}
                  className="h-16 w-16 rounded-full border border-[var(--color-border)]"
                  loading="lazy"
                />
              )}
              <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
                {profile?.name || profile?.username}
              </h3>
              {profile?.bio && <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{profile.bio}</p>}
              <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-2">
                  <FiUsers size={13} /> {profile?.followers ?? 0} {t("sections.github.followers")}
                </span>
                <span className="flex items-center gap-2">
                  <FiCode size={13} /> {profile?.publicRepos ?? 0} {t("sections.github.repos")}
                </span>
                <span className="flex items-center gap-2">
                  <FiStar size={13} /> {reposData?.totalStars ?? 0} {t("sections.github.stars")}
                </span>
              </div>
              {languageEntries.length > 0 && (
                <div className="mt-6">
                  <p className="font-mono text-sm text-[var(--color-primary)]">{t("sections.github.languages")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languageEntries.map(([language, count]) => (
                      <span key={language} className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-muted)]">
                        {language} {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <p className="font-mono text-sm text-[var(--color-primary)]">{t("sections.github.featured")}</p>
              {featured?.length ? (
                <div className="mt-2">
                  {featured.map((repo) => (
                    <RepoRow key={repo.id || repo.name} repo={repo} t={t} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">{t("sections.github.empty")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
