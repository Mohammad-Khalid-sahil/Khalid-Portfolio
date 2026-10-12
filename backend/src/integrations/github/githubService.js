import { env } from "../../config/env.js";
import Profile from "../../models/Profile.js";
import { ApiError } from "../../utils/ApiError.js";

const GITHUB_API = "https://api.github.com";
const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key, value) {
  cache.set(key, {
    value: { ...value, cache: { hit: false, ttlSeconds: env.GITHUB_CACHE_TTL_SECONDS } },
    expiresAt: Date.now() + env.GITHUB_CACHE_TTL_SECONDS * 1000,
  });
  return cache.get(key).value;
}

async function githubFetch(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw ApiError.tooMany("GitHub API rate limit reached");
    throw ApiError.badRequest(`GitHub API request failed: ${response.status}`);
  }
  return response.json();
}

function publicProfile(profile) {
  return {
    username: profile.login,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    url: profile.html_url,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
    location: profile.location,
  };
}

function publicRepo(repo) {
  return {
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
  };
}

async function getConfiguredUsername() {
  const query = Profile.findOne();
  const profile = query && typeof query.select === "function"
    ? await query.select("social.github").lean()
    : await query;
  const urlValue = profile?.social?.github;
  if (urlValue) {
    try {
      const url = new URL(urlValue);
      const username = url.pathname.split("/").filter(Boolean)[0] || "";
      if (["github.com", "www.github.com"].includes(url.hostname.toLowerCase()) &&
          /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(username)) return username;
    } catch {
      // Fall back to the server-side setting when the saved URL is invalid.
    }
  }
  return env.GITHUB_USERNAME;
}

export async function getGithubProfile() {
  const username = await getConfiguredUsername();
  if (!username) throw ApiError.badRequest("GITHUB_USERNAME is not configured");
  const cacheKey = `profile:${username}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, cache: { ...cached.cache, hit: true } };

  const profile = publicProfile(await githubFetch(`/users/${username}`));
  return setCached(cacheKey, { profile });
}

export async function getGithubRepos({ sort = "updated", perPage = 6 } = {}) {
  const username = await getConfiguredUsername();
  if (!username) throw ApiError.badRequest("GITHUB_USERNAME is not configured");
  const safePerPage = Math.min(Math.max(Number(perPage) || 6, 1), 30);
  const cacheKey = `repos:${username}:${sort}:${safePerPage}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, cache: { ...cached.cache, hit: true } };

  const repos = (await githubFetch(`/users/${username}/repos?sort=${sort}&per_page=${safePerPage}`)).map(publicRepo);
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const featured = [...repos].sort((a, b) => b.stars - a.stars || new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  const recentActivity = [...repos].sort((a, b) => new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt)).slice(0, 5);

  return setCached(cacheKey, { repos, languages, totalStars, featured, recentActivity });
}
