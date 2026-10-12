import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.MONGO_URI = "mongodb://127.0.0.1:1/portfolio_health_probe_test";

const { default: app } = await import("../src/app.js");
const mongoose = (await import("mongoose")).default;
let server;
let baseURL;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState) await mongoose.disconnect();
});

test("health endpoint reports database readiness instead of only process liveness", async () => {
  const response = await fetch(`${baseURL}/health`);
  const body = await response.json();
  assert.equal(mongoose.connection.readyState, 0);
  assert.equal(response.status, 503);
  assert.equal(body.success, false);
});
