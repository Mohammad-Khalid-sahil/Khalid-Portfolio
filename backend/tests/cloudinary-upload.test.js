import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_cloudinary_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.STORAGE_PROVIDER = "cloudinary";
process.env.CLOUDINARY_CLOUD_NAME = "portfolio-test-cloud";
process.env.CLOUDINARY_API_KEY = "test-public-key";
process.env.CLOUDINARY_API_SECRET = "test-only-cloudinary-signing-secret";

let app;
let mongoose;
let connectDatabase;
let User;
let Media;
let apiServer;
let baseURL;
const originalFetch = globalThis.fetch;
const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;

before(async () => {
  const [{ default: importedApp }, { default: importedMongoose }, database, { default: importedUser }, { default: importedMedia }] = await Promise.all([
    import("../src/app.js"), import("mongoose"), import("../src/config/database.js"),
    import("../src/models/User.js"), import("../src/models/Media.js"),
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

after(async () => {
  globalThis.fetch = originalFetch;
  if (mongoose?.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (apiServer) await new Promise((resolve) => apiServer.close(resolve));
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Media.deleteMany({})]);
});

async function createUserAndToken(email) {
  await User.create({ name: "Cloudinary Test User", email, password: "Test-Upload-Password-123!", role: "admin" });
  const response = await originalFetch(`${baseURL}/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Test-Upload-Password-123!" }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).data.accessToken;
}

async function sign(token, fields = {}) {
  return originalFetch(`${baseURL}/uploads/sign`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ originalName: "portrait.jpg", mimeType: "image/jpeg", size: 12, usedIn: "profile", uploadTarget: "media", ...fields }),
  });
}

test("Cloudinary signatures are scoped to format, folder, public ID, API key and timestamp without exposing the secret", async () => {
  const { createCloudinaryUpload } = await import("../src/utils/cloudinary.js");
  const upload = createCloudinaryUpload({ filename: "123-random.jpg", mimeType: "image/jpeg", target: "media" });
  const signed = Object.fromEntries(Object.entries(upload.fields).filter(([key]) => !["api_key", "signature"].includes(key)));
  const canonical = Object.entries(signed).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  assert.equal(upload.method, "POST");
  assert.equal(upload.resourceType, "image");
  assert.equal(upload.fields.asset_folder, "portfolio/media");
  assert.equal(upload.fields.allowed_formats, "jpg,jpeg,png,webp,gif");
  assert.equal(upload.fields.overwrite, "false");
  assert.equal(upload.fields.signature, crypto.createHash("sha1").update(`${canonical}${cloudinarySecret}`).digest("hex"));
  assert.equal(JSON.stringify(upload).includes(cloudinarySecret), false);
  const pdf = createCloudinaryUpload({ filename: "123-resume.pdf", mimeType: "application/pdf", target: "media" });
  assert.equal(pdf.resourceType, "raw");
  assert.equal(pdf.fields.allowed_formats, "pdf");
});

test("Cloudinary upload requires media permission, validates metadata and saves only verified provider metadata", async () => {
  assert.equal((await sign("")).status, 401);
  const token = await createUserAndToken("cloudinary-upload-admin@portfolio.dev");
  assert.equal((await sign(token, { originalName: "bad.exe" })).status, 400);
  const authorizationResponse = await sign(token);
  assert.equal(authorizationResponse.status, 200);
  const authorization = (await authorizationResponse.json()).data;
  assert.equal(authorization.provider, "cloudinary");
  assert.equal(new URL(authorization.uploadUrl).hostname, "api.cloudinary.com");
  assert.equal(authorization.fields.api_key, process.env.CLOUDINARY_API_KEY);
  assert.equal(JSON.stringify(authorization).includes(cloudinarySecret), false);

  const version = 12345;
  const signature = crypto.createHash("sha1").update(`public_id=${authorization.fields.public_id}&version=${version}${cloudinarySecret}`).digest("hex");
  const cloudinaryResult = { public_id: authorization.fields.public_id, version, signature };
  globalThis.fetch = async (url, options) => {
    if (!String(url).includes("api.cloudinary.com")) return originalFetch(url, options);
    assert.match(options.headers.authorization, /^Basic /);
    return new Response(JSON.stringify({
      public_id: cloudinaryResult.public_id,
      resource_type: "image",
      asset_folder: "portfolio/media",
      bytes: 12,
      format: "jpg",
      secure_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${cloudinaryResult.public_id}.jpg`,
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const completion = await originalFetch(`${baseURL}/uploads/complete`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorization.uploadToken, cloudinaryResult }),
  });
  assert.equal(completion.status, 201);
  const media = (await completion.json()).data;
  assert.equal(media.storageProvider, "cloudinary");
  assert.equal(media.storageKey, authorization.fields.public_id);
  assert.equal(media.url, `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${authorization.fields.public_id}.jpg`);
  assert.equal(media.size, 12);
  assert.equal(await Media.countDocuments({ storageProvider: "cloudinary" }), 1);
});

test("Cloudinary completion rejects forged signatures and mismatched saved metadata", async () => {
  const token = await createUserAndToken("cloudinary-upload-invalid@portfolio.dev");
  const authorization = (await (await sign(token)).json()).data;
  const response = await originalFetch(`${baseURL}/uploads/complete`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorization.uploadToken, cloudinaryResult: { public_id: authorization.fields.public_id, version: 1, signature: "invalid" } }),
  });
  assert.equal(response.status, 400);
  assert.equal(await Media.countDocuments({ storageProvider: "cloudinary" }), 0);
});

test("Cloudinary Admin API failures return a safe service error without saving media", async () => {
  const token = await createUserAndToken("cloudinary-upload-provider-error@portfolio.dev");
  const authorization = (await (await sign(token)).json()).data;
  const version = 12346;
  const cloudinaryResult = {
    public_id: authorization.fields.public_id,
    version,
    signature: crypto.createHash("sha1").update(`public_id=${authorization.fields.public_id}&version=${version}${cloudinarySecret}`).digest("hex"),
  };
  globalThis.fetch = async (url, options) => String(url).includes("api.cloudinary.com")
    ? new Response("provider failure", { status: 503 })
    : originalFetch(url, options);
  const response = await originalFetch(`${baseURL}/uploads/complete`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ uploadToken: authorization.uploadToken, cloudinaryResult }),
  });
  assert.equal(response.status, 503);
  assert.equal(await Media.countDocuments({ storageProvider: "cloudinary" }), 0);
});
