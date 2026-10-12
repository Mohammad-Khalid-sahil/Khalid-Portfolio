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
  const store = new UpstashRateLimitStore("api", {
    url: "https://redis.test.invalid",
    token: "test-only-token",
    fetchImpl: async () => new Response(JSON.stringify({ error: "sensitive backend detail" }), { status: 200 }),
  });
  store.init({ windowMs: 60_000 });

  await assert.rejects(store.increment("test-client"), (error) => {
    assert.equal(error.message, "Shared rate-limit service command failed.");
    assert.equal(error.message.includes("sensitive backend detail"), false);
    return true;
  });
});
