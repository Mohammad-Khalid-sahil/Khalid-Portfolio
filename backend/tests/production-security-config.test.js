import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

process.env.NODE_ENV = "production";
process.env.MONGO_URI = "mongodb+srv://security-test.invalid/portfolio";
process.env.JWT_SECRET = "a".repeat(48);
process.env.JWT_REFRESH_SECRET = "b".repeat(48);
process.env.CLIENT_URL = "https://portfolio.example.invalid";
process.env.ALLOWED_ORIGINS = "https://portfolio.example.invalid,https://admin.example.invalid";
process.env.LOCAL_STORAGE_PERSISTENT = "true";
delete process.env.AI_PROVIDER_ENABLED;

const [{ env }, { corsOptions }, { getRefreshCookieOptions }, { default: mongoose }, database] = await Promise.all([
  import("../src/config/env.js"),
  import("../src/config/cors.js"),
  import("../src/controllers/authController.js"),
  import("mongoose"),
  import("../src/config/database.js"),
]);
const { generatePortfolioReply } = await import("../src/services/portfolioAiService.js");

test("production keeps the existing secure host-only refresh-cookie contract", () => {
  const options = getRefreshCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "none");
  assert.equal(options.maxAge, env.JWT_REFRESH_EXPIRES_IN_MS);
  assert.equal(Object.hasOwn(options, "domain"), false);
});

test("production CORS permits only explicitly configured origins with credentials", () => {
  assert.equal(corsOptions.credentials, true);
  for (const origin of ["https://portfolio.example.invalid", "https://admin.example.invalid"]) {
    corsOptions.origin(origin, (error, allowed) => {
      assert.equal(error, null);
      assert.equal(allowed, true);
    });
  }
  for (const origin of ["http://localhost:5173", "https://attacker.example.invalid"]) {
    corsOptions.origin(origin, (error, allowed) => {
      assert.ok(error);
      assert.equal(allowed, undefined);
    });
  }
});

test("third-party AI provider calls are opt-in in production while local AI remains enabled", () => {
  assert.equal(env.AI_ENABLED, true);
  assert.equal(env.AI_PROVIDER_ENABLED, false);
});

test("AI keeps its deterministic response path without calling the provider by default", async () => {
  const originalApiKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "test-only-provider-key";
  const originalFetch = globalThis.fetch;
  let providerCalls = 0;
  globalThis.fetch = async () => {
    providerCalls += 1;
    return { ok: true, json: async () => ({ output_text: "provider response" }) };
  };

  try {
    const answer = await generatePortfolioReply("What projects are available?", { projects: [] });
    assert.equal(typeof answer, "string");
    assert.ok(answer.length > 0);
    assert.equal(providerCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test("production database failure logs do not contain the thrown error message", async () => {
  const originalConnect = mongoose.connect;
  const originalConsoleError = console.error;
  const logs = [];
  const failure = new Error(`mongodb://user:${crypto.randomUUID()}@private-host.invalid`);
  mongoose.connect = async () => { throw failure; };
  console.error = (...values) => logs.push(values.join(" "));

  try {
    await assert.rejects(database.connectDatabase(), failure);
  } finally {
    mongoose.connect = originalConnect;
    console.error = originalConsoleError;
  }

  assert.equal(logs.length, 1);
  assert.equal(logs[0], "[database] Connection failed.");
  assert.equal(logs.some((entry) => entry.includes(failure.message)), false);
});

test("production database success logs do not reveal Atlas host or database name", async () => {
  const originalConnect = mongoose.connect;
  const originalConsoleLog = console.log;
  const logs = [];
  mongoose.connect = async () => mongoose;
  console.log = (...values) => logs.push(values.join(" "));

  try {
    await database.connectDatabase();
  } finally {
    mongoose.connection.emit("disconnected");
    mongoose.connect = originalConnect;
    console.log = originalConsoleLog;
  }

  assert.deepEqual(logs, ["[database] Connected."]);
  assert.equal(logs.some((entry) => entry.includes("security-test.invalid")), false);
});
