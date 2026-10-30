import assert from "node:assert/strict";
import { before, after, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";

const adminUserId = new mongoose.Types.ObjectId().toString();
const { env } = await import("../src/config/env.js");

let server;
let baseURL;

function adminToken() {
  return jwt.sign({ sub: adminUserId, role: "admin" }, env.JWT_SECRET);
}

describe("AI provider behavior and status endpoint", () => {
  before(async () => {
    // Start the app server without AI_API_KEY configured
    delete process.env.AI_API_KEY;
    const app = (await import("../src/app.js")).default;
    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });

  it("reports not_configured when AI_API_KEY is missing", async () => {
    const User = (await import("../src/models/User.js")).default;
    User.findById = async (id) => (id === adminUserId ? { _id: adminUserId, role: "admin" } : null);

    const unauthenticated = await fetch(`${baseURL}/ai/status`);
    assert.equal(unauthenticated.status, 401);

    const res = await fetch(`${baseURL}/ai/status`, {
      headers: { authorization: `Bearer ${adminToken()}` },
    });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.data.status, "not_configured");
  });
});

describe("generatePortfolioReply with mocked provider", () => {
  it("falls back to local answer when provider fetch throws", async () => {
    process.env.AI_API_KEY = "fake_key_for_test";

    // Mock fetch to throw
    const realFetch = global.fetch;
    global.fetch = () => {
      throw new Error("network error");
    };

    // Import the service after env is set
    const { generatePortfolioReply } = await import("../src/services/portfolioAiService.js");

    const knowledge = {
      profile: { name: "Mohammad Khalid" },
      skills: [{ name: "React" }],
      projects: [{ title: "Nokta Academy", technologies: ["React"] }],
      services: [],
      experience: [],
      education: [],
      certifications: [],
      blog: [],
      github: null,
    };

    const answer = await generatePortfolioReply("What is React?", knowledge);
    assert.match(answer, /React is a JavaScript library/i);

    global.fetch = realFetch;
  });

  it("uses provider output when fetch returns a provider response", async () => {
    process.env.AI_API_KEY = "fake_key_for_test";

    // Mock fetch to return a provider-style payload
    const realFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ output_text: "Provider: This is a provider response" }),
    });

    const { generatePortfolioReply } = await import("../src/services/portfolioAiService.js");

    const knowledge = { profile: null, skills: [], projects: [], services: [], experience: [], education: [], certifications: [], blog: [], github: null };

    const answer = await generatePortfolioReply("What skills are listed in the portfolio?", knowledge);
    assert.match(answer, /Provider: This is a provider response/);

    global.fetch = realFetch;
  });
});

