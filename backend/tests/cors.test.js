import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.CLIENT_URL = "https://Khalid-Portfolio.vercel.app/";
process.env.ALLOWED_ORIGINS = "https://secondary.test/";

const { default: app } = await import("../src/app.js");
let server;
let baseURL;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("CORS permits the exact configured origin with credentials", async () => {
  const response = await fetch(`${baseURL}/api/auth/refresh`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://khalid-portfolio.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://khalid-portfolio.vercel.app");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});

test("CORS allows CLIENT_URL without requiring it to be duplicated in ALLOWED_ORIGINS", async () => {
  const response = await fetch(`${baseURL}/api/analytics/track`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://khalid-portfolio.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://khalid-portfolio.vercel.app");
});

test("CORS rejects malformed Origin headers", async () => {
  const response = await fetch(`${baseURL}/api/analytics/track`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://khalid-portfolio.vercel.app/untrusted-path",
      "Access-Control-Request-Method": "POST",
    },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("CORS rejects an unconfigured origin without reflecting it", async () => {
  const response = await fetch(`${baseURL}/api/auth/refresh`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://attacker.test",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(body.message, "Origin is not allowed by CORS policy");
});
