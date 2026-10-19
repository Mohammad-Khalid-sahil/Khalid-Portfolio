import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function runEnvValidation(overrides = {}, source = "await import('./src/config/env.js')") {
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
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: process.cwd(),
    env: childEnv,
    encoding: "utf8",
  });
  return `${result.stdout}${result.stderr}`;
}

function getMongoUriDiagnostic(output) {
  const record = output.split(/\r?\n/).find((line) => line.includes('"event":"mongo_uri_validation"'));
  assert.ok(record, "Mongo URI diagnostic record should be present");
  return JSON.parse(record);
}

test("Mongo URI diagnostic identifies missing configuration without exposing a URI", () => {
  const output = runEnvValidation({ MONGO_URI: "", MONGODB_URI: "" });
  const diagnostic = getMongoUriDiagnostic(output);

  assert.deepEqual(diagnostic, {
    event: "mongo_uri_validation",
    MONGO_URI_present: false,
    MONGODB_URI_present: false,
    selectedVariable: "default",
    outcome: "missing",
  });
  assert.match(output, /MONGO_URI must be set to a non-local production database/);
});

test("Mongo URI diagnostic identifies a selected local hostname", () => {
  const output = runEnvValidation({
    MONGO_URI: "mongodb://127.0.0.1:27017/portfolio",
    MONGODB_URI: "mongodb+srv://fallback.example.invalid/portfolio",
  });
  const diagnostic = getMongoUriDiagnostic(output);

  assert.deepEqual(diagnostic, {
    event: "mongo_uri_validation",
    MONGO_URI_present: true,
    MONGODB_URI_present: true,
    selectedVariable: "MONGO_URI",
    protocol: "mongodb:",
    hostname: "127.0.0.1",
    outcome: "local hostname",
  });
});

test("Mongo URI diagnostic identifies an unsupported protocol without echoing the URI", () => {
  const uri = "https://mongo.example.invalid/database?private=query-value";
  const output = runEnvValidation({ MONGO_URI: uri });
  const diagnostic = getMongoUriDiagnostic(output);

  assert.deepEqual(diagnostic, {
    event: "mongo_uri_validation",
    MONGO_URI_present: true,
    MONGODB_URI_present: false,
    selectedVariable: "MONGO_URI",
    protocol: "https:",
    hostname: "mongo.example.invalid",
    outcome: "unsupported protocol",
  });
  assert.equal(output.includes(uri), false);
  assert.equal(output.includes("private=query-value"), false);
});

test("Mongo URI diagnostic accepts an external Atlas-style hostname and redacts credentials", () => {
  const uri = "mongodb+srv://private-user:private-password@cluster.example.mongodb.net/portfolio?token=private-query-value";
  const output = runEnvValidation({ MONGO_URI: "", MONGODB_URI: uri });
  const diagnostic = getMongoUriDiagnostic(output);

  assert.deepEqual(diagnostic, {
    event: "mongo_uri_validation",
    MONGO_URI_present: false,
    MONGODB_URI_present: true,
    selectedVariable: "MONGODB_URI",
    protocol: "mongodb+srv:",
    hostname: "cluster.example.mongodb.net",
    outcome: "valid external hostname",
  });
  assert.equal(output.includes(uri), false);
  for (const secret of ["private-user", "private-password", "private-query-value"]) {
    assert.equal(output.includes(secret), false);
  }
});

test("Vercel production requires shared rate-limit credentials without echoing values", () => {
  const output = runEnvValidation();
  assert.match(output, /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/);
  assert.equal(output.includes("test-only-api-secret"), false);
});

test("Vercel Preview accepts long random JWT secrets containing the word secret", () => {
  const accessSecret = `${randomBytes(32).toString("hex")}secret`;
  const refreshSecret = `${randomBytes(32).toString("hex")}secret`;
  const output = runEnvValidation({
    JWT_SECRET: accessSecret,
    JWT_REFRESH_SECRET: refreshSecret,
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });

  assert.doesNotMatch(output, /Insecure production secret configuration/);
  assert.doesNotMatch(output, /Error:/);
  assert.equal(output.includes(accessSecret), false);
  assert.equal(output.includes(refreshSecret), false);
});

test("production Mongo connection validation rejects non-Mongo schemes generically", () => {
  const uri = "https://should-not-be-printed.invalid/portfolio";
  const output = runEnvValidation({
    MONGO_URI: uri,
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /MONGO_URI must be set to a non-local production database/);
  assert.equal(output.includes(uri), false);
  assert.deepEqual(getMongoUriDiagnostic(output), {
    event: "mongo_uri_validation",
    MONGO_URI_present: true,
    MONGODB_URI_present: false,
    selectedVariable: "MONGO_URI",
    protocol: "https:",
    hostname: "should-not-be-printed.invalid",
    outcome: "unsupported protocol",
  });
});

test("production rejects a local Mongo URI without echoing the URI", () => {
  const output = runEnvValidation({
    MONGO_URI: "mongodb://127.0.0.1:27017/private-test",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /MONGO_URI must be set to a non-local production database/);
  assert.equal(output.includes("private-test"), false);
});

test("production rejects the local Mongo fallback when both URI variables are blank", () => {
  const output = runEnvValidation({
    MONGO_URI: "",
    MONGODB_URI: "",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /MONGO_URI must be set to a non-local production database/);
  assert.equal(output.includes("127.0.0.1"), false);
});

test("MONGO_URI takes precedence over the supported MONGODB_URI alias", () => {
  const output = runEnvValidation({
    MONGO_URI: "mongodb+srv://primary.test.invalid/portfolio",
    MONGODB_URI: "mongodb+srv://fallback.test.invalid/portfolio",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  }, "const {env}=await import('./src/config/env.js');console.log(env.MONGO_URI.includes('primary.test.invalid'))");
  assert.match(output, /true/);
  assert.equal(output.includes("fallback.test.invalid"), false);
});

test("production treats CLIENT_URL as an allowed origin without requiring a duplicate entry", () => {
  const output = runEnvValidation({
    ALLOWED_ORIGINS: "https://secondary.test-domain.org/",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.equal(output.includes("CLIENT_URL must be included"), false);
  assert.equal(output.includes("Error:"), false);
});

test("production rejects origin paths without echoing the configured value", () => {
  const output = runEnvValidation({
    ALLOWED_ORIGINS: "https://frontend.test-domain.org/private-path",
    UPSTASH_REDIS_REST_URL: "https://redis.test.invalid",
    UPSTASH_REDIS_REST_TOKEN: "test-only-redis-token",
  });
  assert.match(output, /ALLOWED_ORIGINS must contain valid HTTP\(S\) origins/);
  assert.equal(output.includes("private-path"), false);
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
