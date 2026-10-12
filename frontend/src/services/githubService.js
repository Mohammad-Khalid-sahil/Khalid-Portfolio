import api from "./api";
import { DEFAULT_GITHUB_PROFILE_URL } from "@/config/socialLinks";

const GITHUB_API_URL = "https://api.github.com";

function getDefaultGithubUsername() {
  return new URL(DEFAULT_GITHUB_PROFILE_URL).pathname.split("/").filter(Boolean)[0];
}

async function getPublicGithubData(path) {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub API request failed (${response.status})`);
  return response.json();
}

async function getPublicGithubProfile() {
  const profile = await getPublicGithubData(`/users/${getDefaultGithubUsername()}`);
  return {
    profile: {
      username: profile.login,
      name: profile.name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      url: profile.html_url,
      followers: profile.followers,
      following: profile.following,
      publicRepos: profile.public_repos,
      location: profile.location,
    },
  };
}

async function getPublicGithubRepos(limit) {
  const repos = (await getPublicGithubData(`/users/${getDefaultGithubUsername()}/repos?sort=updated&per_page=${limit}`)).map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: repo.topics || [],
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    featured: Boolean(repo.stargazers_count || repo.topics?.includes("featured")),
  }));
  const languages = repos.reduce((counts, repo) => {
    if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
    return counts;
  }, {});
  return {
    repos,
    languages,
    totalStars: repos.reduce((total, repo) => total + repo.stars, 0),
    featured: [...repos].sort((a, b) => b.stars - a.stars || new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3),
    recentActivity: [...repos].sort((a, b) => new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt)).slice(0, 5),
  };
}

export function getGithubProfile() {
  return api.get("/github/profile").then((res) => res.data).catch(getPublicGithubProfile);
}

export function getGithubRepos(limit = 6) {
  return api.get("/github/repos", { params: { limit } }).then((res) => res.data).catch(() => getPublicGithubRepos(limit));
}
