import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.MONGO_URI = "";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/portfolio_env_alias_test";
process.env.STORAGE_PROVIDER = "local";
process.env.LOCAL_STORAGE_DIR = "./test-uploads";
process.env.LOCAL_STORAGE_PERSISTENT = "false";
process.env.HOST = "127.0.0.1";
const { env, getSeedAdminCredentials, parseJwtDurationMs } = await import("../src/config/env.js");

test("uses a short access lifetime and parses refresh durations for cookie expiry", () => {
  assert.equal(env.JWT_EXPIRES_IN, "15m");
  assert.equal(env.JWT_EXPIRES_IN_MS, 900_000);
  assert.equal(env.JWT_REFRESH_EXPIRES_IN_MS, 7 * 24 * 60 * 60 * 1000);
  assert.equal(parseJwtDurationMs("2h"), 7_200_000);
  assert.throws(() => parseJwtDurationMs("0m"), /at least one second/);
  assert.throws(() => parseJwtDurationMs("1ms"), /at least one second/);
  assert.throws(() => parseJwtDurationMs("15"), /positive integer followed by/);
});

test("loads documented Mongo, host, and upload settings into runtime config", () => {
  assert.equal(env.MONGO_URI, process.env.MONGODB_URI);
  assert.equal(env.HOST, "127.0.0.1");
  assert.equal(env.STORAGE_PROVIDER, "local");
  assert.equal(env.LOCAL_STORAGE_DIR, "./test-uploads");
  assert.equal(env.LOCAL_STORAGE_PERSISTENT, false);
});

test("requires explicit non-placeholder credentials for admin utilities", () => {
  process.env.SEED_ADMIN_EMAIL = `admin-${randomUUID()}@test.invalid`;
  process.env.SEED_ADMIN_PASSWORD = randomBytes(24).toString("hex");
  assert.deepEqual(getSeedAdminCredentials(), {
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });

  const configuredPassword = process.env.SEED_ADMIN_PASSWORD;
  process.env.SEED_ADMIN_PASSWORD = "replace_with_a_password";
  assert.throws(getSeedAdminCredentials, /SEED_ADMIN_PASSWORD/);
  process.env.SEED_ADMIN_PASSWORD = configuredPassword;
});
