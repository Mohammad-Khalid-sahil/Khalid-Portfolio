import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_analytics_github_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.GITHUB_USERNAME = "codex-test-user";
process.env.GITHUB_CACHE_TTL_SECONDS = "60";

const [
  { default: app },
  { default: mongoose },
  { connectDatabase },
  { default: User },
  { default: Analytics },
  { default: Profile },
  { getGithubProfile, getGithubRepos },
] = await Promise.all([
  import("../src/app.js"),
  import("mongoose"),
  import("../src/config/database.js"),
  import("../src/models/User.js"),
  import("../src/models/Analytics.js"),
  import("../src/models/Profile.js"),
  import("../src/integrations/github/githubService.js"),
]);

let server;
let baseURL;
let adminToken;
let originalFetch;

async function request(path, { method = "GET", body, token, headers = {} } = {}) {
  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders["content-type"] = "application/json";
  if (token) requestHeaders.authorization = `Bearer ${token}`;

  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, body: json };
}

async function createAdminSession() {
  await User.create({
    name: "Admin User",
    email: "analytics-admin@portfolio.dev",
    password: "ChangeMe123!",
    role: "admin",
  });

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "analytics-admin@portfolio.dev", password: "ChangeMe123!" },
  });

  adminToken = login.body.data.accessToken;
}

before(async () => {
  originalFetch = globalThis.fetch;
  await connectDatabase();
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  globalThis.fetch = originalFetch;
  await Promise.all([User.deleteMany({}), Analytics.deleteMany({}), Profile.deleteMany({})]);
  adminToken = null;
});

after(async () => {
  globalThis.fetch = originalFetch;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test("analytics tracks public page and content views, then returns admin summary", async () => {
  await createAdminSession();

  const page = await request("/analytics/track", {
    method: "POST",
    headers: {
      "user-agent": "Mozilla/5.0 Chrome/120",
      "cf-ipcountry": "US",
    },
    body: { path: "/projects", referrer: "https://www.google.com/search?q=portfolio", sessionId: "session-one" },
  });
  const project = await request("/analytics/track", {
    method: "POST",
    headers: { "user-agent": "Mozilla/5.0 iPhone Mobile Safari/605" },
    body: {
      path: "/projects/demo",
      eventType: "project_view",
      contentType: "project",
      contentId: "project-1",
      contentTitle: "Demo Project",
      sessionId: "session-one",
    },
  });
  const blog = await request("/analytics/track", {
    method: "POST",
    body: {
      path: "/blog/demo",
      eventType: "blog_view",
      contentType: "blog",
      contentId: "blog-1",
      contentTitle: "Demo Blog",
      sessionId: "session-two",
    },
  });

  const summary = await request("/analytics/summary", { token: adminToken });

  assert.equal(page.status, 201);
  assert.equal(project.status, 201);
  assert.equal(blog.status, 201);
  assert.equal(summary.status, 200);
  assert.equal(summary.body.data.totalViews, 1);
  assert.equal(summary.body.data.visitors, 2);
  assert.equal(summary.body.data.projectViews, 1);
  assert.equal(summary.body.data.blogViews, 1);
  assert.equal(summary.body.data.sources.some((source) => source._id === "search"), true);
  assert.equal(summary.body.data.countries[0]._id, "US");
  assert.equal(summary.body.data.popularContent.length, 2);
});


test("uses the Admin profile GitHub URL for public GitHub data", async () => {
  await Profile.create({
    name: "Portfolio Owner",
    title: "Developer",
    tagline: "Building software",
    email: "owner@example.com",
    social: { github: "https://github.com/Mohammad-Khalid-sahil" },
  });

  let requestedUrl = "";
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      json: async () => ({
        login: "Mohammad-Khalid-sahil",
        name: "Portfolio Owner",
        avatar_url: "https://example.com/avatar.png",
        html_url: "https://github.com/Mohammad-Khalid-sahil",
        followers: 0,
        following: 0,
        public_repos: 0,
      }),
    };
  };

  const result = await getGithubProfile();
  assert.equal(requestedUrl, "https://api.github.com/users/Mohammad-Khalid-sahil");
  assert.equal(result.profile.username, "Mohammad-Khalid-sahil");
});
test("github profile and repos are cached and expose public fields only", async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    const isRepos = String(url).includes("/repos?");
    return {
      ok: true,
      json: async () =>
        isRepos
          ? [
              {
                id: 1,
                name: "portfolio",
                full_name: "codex-test-user/portfolio",
                description: "Public repo",
                html_url: "https://github.com/codex-test-user/portfolio",
                stargazers_count: 7,
                forks_count: 2,
                language: "JavaScript",
                topics: ["featured"],
                updated_at: "2026-01-01T00:00:00Z",
                pushed_at: "2026-01-02T00:00:00Z",
              },
            ]
          : {
              login: "codex-test-user",
              name: "Codex Test",
              avatar_url: "https://example.com/avatar.png",
              bio: "Builder",
              html_url: "https://github.com/codex-test-user",
              followers: 3,
              following: 1,
              public_repos: 9,
              location: "Internet",
            },
    };
  };

  const profile = await getGithubProfile();
  const profileAgain = await getGithubProfile();
  const repos = await getGithubRepos({ perPage: 8 });
  const reposAgain = await getGithubRepos({ perPage: 8 });

  assert.equal(calls, 2);
  assert.equal(profile.profile.username, "codex-test-user");
  assert.equal(profileAgain.cache.hit, true);
  assert.equal(repos.repos[0].stars, 7);
  assert.equal(repos.languages.JavaScript, 1);
  assert.equal(reposAgain.cache.hit, true);
});
