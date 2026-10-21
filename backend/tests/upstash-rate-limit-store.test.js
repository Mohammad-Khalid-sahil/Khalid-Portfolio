import assert from "node:assert/strict";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/portfolio_rate_limit_store_test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";

const { UpstashRateLimitStore } = await import("../src/utils/UpstashRateLimitStore.js");

test("Upstash rate-limit store uses atomic shared counters and returns expiry metadata", async () => {
  let sentCommand;
  const store = new UpstashRateLimitStore("ai", {
    url: "https://redis.test.invalid",
    token: "test-only-token",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://redis.test.invalid");
      assert.equal(options.headers.authorization, "Bearer test-only-token");
      sentCommand = JSON.parse(options.body);
      return new Response(JSON.stringify({ result: [3, 45_000] }), { status: 200 });
    },
  });
  store.init({ windowMs: 60_000 });
  const result = await store.increment("198.51.100.25");

  assert.equal(sentCommand[0], "EVAL");
  assert.match(sentCommand[1], /INCR/);
  assert.match(sentCommand[1], /PEXPIRE/);
  assert.equal(sentCommand[2], "1");
  assert.match(sentCommand[3], /^portfolio:ratelimit:ai:[a-f0-9]{64}$/);
  assert.equal(sentCommand[3].includes("198.51.100.25"), false);
  assert.equal(sentCommand[4], "60000");
  assert.equal(result.totalHits, 3);
  assert.ok(result.resetTime instanceof Date);
});

test("Upstash storage errors fail closed without leaking provider error details", async () => {
  const logged = [];
  const originalError = console.error;
  console.error = (line) => logged.push(String(line));
  const store = new UpstashRateLimitStore("api", {
    url: "https://redis.test.invalid",
    token: "test-only-token",
    fetchImpl: async () => new Response(JSON.stringify({ error: "sensitive backend detail" }), { status: 200 }),
  });
  store.init({ windowMs: 60_000 });

  try {
    await assert.rejects(store.increment("test-client"), (error) => {
      assert.equal(error.message, "Shared rate-limit service command failed.");
      assert.equal(error.message.includes("sensitive backend detail"), false);
      return true;
    });
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(JSON.parse(logged[0]), { event: "shared_rate_limit_failure", category: "command_error" });
  assert.equal(logged.join(" ").includes("sensitive backend detail"), false);
  assert.equal(logged.join(" ").includes("test-only-token"), false);
});

test("Upstash HTTP failures log only status and network failures log safe classifications", async () => {
  const logged = [];
  const originalError = console.error;
  console.error = (line) => logged.push(String(line));
  try {
    const httpStore = new UpstashRateLimitStore("api", {
      url: "https://redis.test.invalid",
      token: "private-token-sentinel",
      fetchImpl: async () => new Response("private response body", { status: 401 }),
    });
    await assert.rejects(httpStore.increment("test-client"), /Shared rate-limit service request failed/);

    const networkStore = new UpstashRateLimitStore("api", {
      url: "https://redis.test.invalid",
      token: "private-token-sentinel",
      fetchImpl: async () => { throw Object.assign(new TypeError("private network detail"), { cause: { code: "ECONNRESET" } }); },
    });
    await assert.rejects(networkStore.increment("test-client"), /Shared rate-limit service request failed/);
  } finally {
    console.error = originalError;
  }

  assert.deepEqual(logged.map((line) => JSON.parse(line)), [
    { event: "shared_rate_limit_failure", category: "http_error", status: 401 },
    { event: "shared_rate_limit_failure", category: "network_error", errorName: "RequestError", code: "ECONNRESET" },
  ]);
  assert.equal(logged.join(" ").includes("private-token-sentinel"), false);
  assert.equal(logged.join(" ").includes("private response body"), false);
  assert.equal(logged.join(" ").includes("private network detail"), false);
});
