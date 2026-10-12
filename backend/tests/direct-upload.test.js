import assert from "node:assert/strict";
import http from "node:http";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_direct_upload_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.STORAGE_PROVIDER = "s3";
process.env.S3_BUCKET = "portfolio-test-bucket";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-only-access-key";
process.env.S3_SECRET_ACCESS_KEY = "test-only-signing-material";
process.env.S3_PUBLIC_URL = "https://media.test.invalid";

const objects = new Map();
let providerServer;
let apiServer;
let baseURL;
let app;
let mongoose;
let connectDatabase;
let User;
let Media;

function objectKeyFromRequest(request) {
  return decodeURIComponent(new URL(request.url, "http://storage.test").pathname.split("/").slice(2).join("/"));
}

before(async () => {
  providerServer = http.createServer(async (request, response) => {
    const key = objectKeyFromRequest(request);
    if (request.method === "PUT") {
      if (request.headers["if-none-match"] !== "*") {
        response.writeHead(428).end();
        return;
      }
      if (objects.has(key)) {
        response.writeHead(412).end();
        return;
      }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      objects.set(key, { bytes: Buffer.concat(chunks), mimeType: request.headers["content-type"] });
      response.writeHead(200).end();
      return;
    }
    const object = objects.get(key);
    if (!object) {
      response.writeHead(404).end();
      return;
    }
    if (request.method === "HEAD") {
      response.writeHead(200, {
        "content-length": object.bytes.length,
        "content-type": object.mimeType,
      }).end();
      return;
    }
    if (request.method === "GET") {
      response.writeHead(206, {
        "content-length": object.bytes.subarray(0, 12).length,
        "content-type": object.mimeType,
        "content-range": `bytes 0-${Math.min(11, object.bytes.length - 1)}/${object.bytes.length}`,
      }).end(object.bytes.subarray(0, 12));
      return;
    }
    if (request.method === "DELETE") {
      objects.delete(key);
      response.writeHead(204).end();
      return;
    }
    response.writeHead(405).end();
  });
  await new Promise((resolve) => providerServer.listen(0, "127.0.0.1", resolve));
  process.env.S3_ENDPOINT = `http://127.0.0.1:${providerServer.address().port}`;

  const [{ default: importedApp }, { default: importedMongoose }, database, { default: importedUser }, { default: importedMedia }] = await Promise.all([
    import("../src/app.js"),
    import("mongoose"),
    import("../src/config/database.js"),
    import("../src/models/User.js"),
    import("../src/models/Media.js"),
  ]);
  app = importedApp;
  mongoose = importedMongoose;
  connectDatabase = database.connectDatabase;
  User = importedUser;
  Media = importedMedia;
  await connectDatabase();
  apiServer = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    apiServer.once("listening", resolve);
    apiServer.once("error", reject);
  });
  baseURL = `http://127.0.0.1:${apiServer.address().port}/api`;
});

beforeEach(async () => {
  objects.clear();
  await Promise.all([User.deleteMany({}), Media.deleteMany({})]);
});

after(async () => {
  if (mongoose?.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (apiServer) await new Promise((resolve) => apiServer.close(resolve));
  if (providerServer) await new Promise((resolve) => providerServer.close(resolve));
});

async function createUserAndToken(email, role = "admin") {
  await User.create({ name: "Upload Test User", email, password: "Test-Upload-Password-123!", role });
  const response = await fetch(`${baseURL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Test-Upload-Password-123!" }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).data.accessToken;
}

async function authorizeUpload(token, details = {}) {
  return fetch(`${baseURL}/uploads/sign`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      originalName: "portrait.jpg",
      mimeType: "image/jpeg",
      size: 12,
      usedIn: "profile",
      uploadTarget: "project",
      ...details,
    }),
  });
}

test("direct upload authorization enforces authentication, role, and metadata policy", async () => {
  const unauthenticated = await authorizeUpload("");
  assert.equal(unauthenticated.status, 401);

  const adminToken = await createUserAndToken("direct-upload-admin@portfolio.dev");
  assert.equal((await authorizeUpload(adminToken, { originalName: "payload.exe" })).status, 400);
  assert.equal((await authorizeUpload(adminToken, { size: 5 * 1024 * 1024 + 1 })).status, 400);
  assert.equal((await authorizeUpload(adminToken, { mimeType: "application/pdf" })).status, 400);

  const validResponse = await authorizeUpload(adminToken);
  assert.equal(validResponse.status, 200);
  const authorized = (await validResponse.json()).data;
  assert.equal(authorized.mode, "direct");
  assert.equal(authorized.method, "PUT");
  assert.ok(authorized.uploadToken);
  assert.equal(Object.hasOwn(authorized, "secretAccessKey"), false);

});

test("direct upload verifies object size and file signature before recording the unchanged media fields and URL", async () => {
  const token = await createUserAndToken("direct-upload-complete@portfolio.dev");
  const authorized = (await (await authorizeUpload(token)).json()).data;
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const uploadResponse = await fetch(authorized.uploadUrl, {
    method: authorized.method,
    headers: authorized.headers,
    body: bytes,
  });
  assert.equal(uploadResponse.status, 200);

  const completionResponse = await fetch(`${baseURL}/uploads/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorized.uploadToken }),
  });
  assert.equal(completionResponse.status, 201);
  const media = (await completionResponse.json()).data;
  assert.equal(media.filename.endsWith(".jpg"), true);
  assert.equal(media.storageProvider, "s3");
  assert.equal(media.storageKey, media.filename);
  assert.equal(media.originalName, "portrait.jpg");
  assert.equal(media.mimeType, "image/jpeg");
  assert.equal(media.size, bytes.length);
  assert.equal(media.url, `https://media.test.invalid/${media.storageKey}`);
  assert.ok(media.uploadedBy);

  const replayResponse = await fetch(`${baseURL}/uploads/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorized.uploadToken }),
  });
  assert.equal(replayResponse.status, 409);
  assert.equal(objects.size, 1);
  assert.equal(await Media.countDocuments(), 1);
});

test("direct upload rejects bad object bytes and mismatched sizes and removes only the new object", async () => {
  const token = await createUserAndToken("direct-upload-invalid@portfolio.dev");
  const authorized = (await (await authorizeUpload(token)).json()).data;
  const badBytes = Buffer.from("not-an-image");
  const uploadResponse = await fetch(authorized.uploadUrl, {
    method: authorized.method,
    headers: authorized.headers,
    body: badBytes,
  });
  assert.equal(uploadResponse.status, 200);

  const completionResponse = await fetch(`${baseURL}/uploads/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorized.uploadToken }),
  });
  assert.equal(completionResponse.status, 400);
  assert.equal(objects.size, 0);
  assert.equal(await Media.countDocuments(), 0);
});

test("direct upload reports a provider error when the signed object was never uploaded", async () => {
  const token = await createUserAndToken("direct-upload-missing@portfolio.dev");
  const authorized = (await (await authorizeUpload(token)).json()).data;
  const completionResponse = await fetch(`${baseURL}/uploads/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorized.uploadToken }),
  });

  assert.equal(completionResponse.status, 503);
  assert.equal(await Media.countDocuments(), 0);
});

test("upload completion token cannot be used by another authorized admin", async () => {
  const ownerToken = await createUserAndToken("direct-upload-owner@portfolio.dev");
  const otherToken = await createUserAndToken("direct-upload-other@portfolio.dev");
  const authorized = (await (await authorizeUpload(ownerToken)).json()).data;

  const completionResponse = await fetch(`${baseURL}/uploads/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${otherToken}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorized.uploadToken }),
  });
  assert.equal(completionResponse.status, 403);
  assert.equal(await Media.countDocuments(), 0);
});
