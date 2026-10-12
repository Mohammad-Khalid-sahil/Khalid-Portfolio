import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function runEnvValidation(overrides = {}) {
  const childEnv = {
    ...process.env,
    NODE_ENV: "production",
    VERCEL: "1",
    MONGO_URI: "mongodb+srv://atlas-test.invalid/portfolio",
    JWT_SECRET: "a".repeat(48),
    JWT_REFRESH_SECRET: "b".repeat(48),
    CLIENT_URL: "https://portfolio.test-domain.invalid",
    ALLOWED_ORIGINS: "https://portfolio.test-domain.invalid",
    STORAGE_PROVIDER: "cloudinary",
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-only-api-key",
    CLOUDINARY_API_SECRET: "test-only-api-secret",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
    ...overrides,
  };
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", "await import('./src/config/env.js')"], {
    cwd: process.cwd(),
    env: childEnv,
    encoding: "utf8",
  });
  return `${result.stdout}${result.stderr}`;
}

test("Vercel production requires shared rate-limit credentials without echoing values", () => {
  const output = runEnvValidation();
  assert.match(output, /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/);
  assert.equal(output.includes("test-only-api-secret"), false);
});

test("production Mongo connection validation rejects non-Mongo schemes generically", () => {
  const output = runEnvValidation({
    MONGO_URI: "https://should-not-be-printed.invalid/portfolio",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /MONGO_URI must be set to a non-local production database/);
  assert.equal(output.includes("should-not-be-printed"), false);
});

test("production requires an HTTPS Upstash endpoint", () => {
  const output = runEnvValidation({
    UPSTASH_REDIS_REST_URL: "http://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /UPSTASH_REDIS_REST_URL must be an HTTPS endpoint/);
  assert.equal(output.includes("test-only-redis-token"), false);
});

test("Vercel preview defaults provider AI off and uses production security mode", () => {
  const childEnv = {
    ...process.env,
    NODE_ENV: "development",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    MONGO_URI: "mongodb+srv://atlas-test.invalid/portfolio",
    JWT_SECRET: "a".repeat(48),
    JWT_REFRESH_SECRET: "b".repeat(48),
    CLIENT_URL: "https://portfolio.test-domain.invalid",
    ALLOWED_ORIGINS: "https://portfolio.test-domain.invalid",
    STORAGE_PROVIDER: "cloudinary",
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-only-api-key",
    CLOUDINARY_API_SECRET: "test-only-api-secret",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  };
  delete childEnv.AI_PROVIDER_ENABLED;
  const result = spawnSync(process.execPath, [
    "--input-type=module", "-e",
    "const {env,isProd}=await import('./src/config/env.js');console.log(JSON.stringify({provider:env.AI_PROVIDER_ENABLED,isProd}))",
  ], { cwd: process.cwd(), env: childEnv, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\{"provider":false,"isProd":true\}/);
});
