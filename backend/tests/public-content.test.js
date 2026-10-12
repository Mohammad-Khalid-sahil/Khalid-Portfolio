import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.GITHUB_USERNAME = "octocat";

const app = (await import("../src/app.js")).default;
const Profile = (await import("../src/models/Profile.js")).default;
const Analytics = (await import("../src/models/Analytics.js")).default;
const User = (await import("../src/models/User.js")).default;

let server;
let baseURL;
let createdEvents = [];
const originalFetch = global.fetch;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { response, status: response.status, body: json };
}

describe("public content and GitHub routes", () => {
  before(async () => {
    User.findById = async (id) => ({ _id: id, name: "Admin", email: "admin@example.com", role: "admin" });
    Profile.findOne = async () => null;
    Profile.create = async (payload) => ({ _id: new mongoose.Types.ObjectId().toString(), ...payload });
    Analytics.create = async (payload) => {
      createdEvents.push(payload);
      return { _id: new mongoose.Types.ObjectId().toString(), ...payload };
    };

    global.fetch = async (url, options) => {
      if (!String(url).includes("api.github.com")) {
        return originalFetch(url, options);
      }

      if (String(url).includes("/users/octocat/repos")) {
        return {
          ok: true,
          json: async () => [
            {
              id: 1,
              name: "project-one",
              full_name: "octocat/project-one",
              description: "Example repo",
              html_url: "https://github.com/octocat/project-one",
              stargazers_count: 15,
              forks_count: 2,
              language: "JavaScript",
              topics: ["featured"],
              updated_at: "2024-01-15T00:00:00Z",
              pushed_at: "2024-02-10T00:00:00Z",
            },
          ],
        };
      }

      if (String(url).includes("/users/octocat")) {
        return {
          ok: true,
          json: async () => ({
            login: "octocat",
            name: "The Octocat",
            avatar_url: "https://example.com/avatar.png",
            bio: "Hello GitHub",
            html_url: "https://github.com/octocat",
            followers: 12,
            following: 4,
            public_repos: 10,
            location: "San Francisco",
          }),
        };
      }

      return { ok: false, status: 500, json: async () => ({}) };
    };

    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  });

  it("returns an empty public profile when one has not been configured", async () => {
    const result = await request("/profile");

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data, undefined);
  });

  it("tracks analytics events with the expected metadata", async () => {
    createdEvents = [];
    const result = await request("/analytics/track", {
      method: "POST",
      body: {
        path: "/projects/portfolio",
        referrer: "https://www.google.com/search?q=portfolio",
        sessionId: "abc-123",
        eventType: "project_view",
        contentType: "project",
        contentId: "project_42",
        contentTitle: "Portfolio App",
      },
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.message, "Event tracked");
    assert.equal(createdEvents.length, 1);
    assert.equal(createdEvents[0].source, "search");
    assert.equal(createdEvents[0].path, "/projects/portfolio");
  });

  it("returns the configured GitHub profile and repository metadata", async () => {
    const profile = await request("/github/profile");
    const repos = await request("/github/repos?limit=3");

    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.profile.username, "octocat");
    assert.equal(profile.body.data.profile.name, "The Octocat");

    assert.equal(repos.status, 200);
    assert.equal(repos.body.data.repos[0].fullName, "octocat/project-one");
    assert.equal(repos.body.meta.count, 1);
    assert.equal(repos.body.data.featured[0].name, "project-one");
  });
});
