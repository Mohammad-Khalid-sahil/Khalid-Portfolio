import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.VERCEL = "1";
process.env.JWT_SECRET = "a".repeat(64);
process.env.JWT_REFRESH_SECRET = "b".repeat(64);
process.env.MONGO_URI = "mongodb://192.0.2.1:1/portfolio_vercel_entry_test";
process.env.CLIENT_URL = "https://portfolio-test.example.org";
process.env.ALLOWED_ORIGINS = process.env.CLIENT_URL;
process.env.STORAGE_PROVIDER = "cloudinary";
process.env.CLOUDINARY_CLOUD_NAME = "portfolio-test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-only-cloudinary-secret";
process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.org";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-only-upstash-token";

const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const requestUrl = typeof input === "string" ? input : input.url;
  if (new URL(requestUrl).hostname === "redis.example.org") {
    return Promise.resolve(new Response(JSON.stringify({ result: [1, 60_000] }), { status: 200 }));
  }
  return nativeFetch(input, options);
};

const { default: vercelEntry } = await import("../src/server.js");
const mongoose = (await import("mongoose")).default;
let server;
let baseUrl;

before(async () => {
  server = vercelEntry.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState) await mongoose.disconnect();
  globalThis.fetch = nativeFetch;
});

test("Vercel entry exports an Express application", () => {
  assert.equal(typeof vercelEntry.handle, "function");
  assert.equal(typeof vercelEntry.listen, "function");
});

test("Vercel entry preserves root, API health, and not-found routing", async () => {
  const rootResponse = await fetch(`${baseUrl}/`);
  const rootBody = await rootResponse.json();
  assert.equal(rootResponse.status, 200);
  assert.equal(rootBody.success, true);

  const originalConnect = mongoose.connect;
  mongoose.connect = async () => { throw Object.assign(new Error("private connection detail"), { name: "MongooseServerSelectionError" }); };

  let healthResponse;
  let serviceResponse;
  try {
    healthResponse = await fetch(`${baseUrl}/api/health`);
    serviceResponse = await fetch(`${baseUrl}/api/services`);
  } finally {
    mongoose.connect = originalConnect;
  }

  const healthBody = await healthResponse.json();
  assert.equal(healthResponse.status, 503);
  assert.equal(healthBody.success, false);

  const serviceBody = await serviceResponse.json();
  assert.equal(serviceResponse.status, 503);
  assert.deepEqual(serviceBody, { success: false, message: "Database is temporarily unavailable" });

  const missingResponse = await fetch(`${baseUrl}/not-a-route`);
  assert.equal(missingResponse.status, 404);
});

test("Vercel does not serve uploads from the local filesystem", async () => {
  const response = await fetch(`${baseUrl}/uploads/1789276884437-ef65b8cf3c21b126d6817ac0b62087d0.jpeg`);
  assert.equal(response.status, 404);
});
