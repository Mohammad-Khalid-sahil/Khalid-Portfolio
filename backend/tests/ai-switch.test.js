import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.AI_ENABLED = "false";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";

const { default: app } = await import("../src/app.js");
const { env } = await import("../src/config/env.js");
const mongoose = (await import("mongoose")).default;
let server;
let baseURL;

before(() => {
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState) await mongoose.disconnect();
});

test("AI_ENABLED=false blocks public AI chat without contacting a provider", async () => {
  assert.equal(env.AI_ENABLED, false);
  const response = await fetch(`${baseURL}/ai/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "What projects have you built?" }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.message, "AI chat is temporarily disabled");
});
