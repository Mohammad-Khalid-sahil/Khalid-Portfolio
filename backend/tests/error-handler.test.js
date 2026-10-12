import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

process.env.NODE_ENV = "production";
process.env.MONGO_URI = "mongodb+srv://unused@example.invalid/portfolio";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_REFRESH_SECRET = crypto.randomBytes(32).toString("hex");
process.env.CLIENT_URL = "https://frontend.invalid";
process.env.ALLOWED_ORIGINS = "https://frontend.invalid";
process.env.LOCAL_STORAGE_PERSISTENT = "true";

const [{ errorHandler }, { ApiError }] = await Promise.all([
  import("../src/middlewares/errorHandler.js"),
  import("../src/utils/ApiError.js"),
]);

function handle(error) {
  let result;
  let status;
  const res = {
    status(value) { status = value; return this; },
    json(value) { result = value; return this; },
  };
  errorHandler(error, {}, res, () => {});
  return { status, body: result };
}

test("production hides unexpected internal 500 messages and details", () => {
  const result = handle(Object.assign(new Error("private infrastructure detail"), { details: { host: "internal" } }));

  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { success: false, message: "Internal server error" });
});

test("production preserves safe operational API errors", () => {
  const result = handle(ApiError.serviceUnavailable("AI chat is temporarily disabled"));

  assert.equal(result.status, 503);
  assert.equal(result.body.message, "AI chat is temporarily disabled");
  assert.equal(Object.hasOwn(result.body, "stack"), false);
});
