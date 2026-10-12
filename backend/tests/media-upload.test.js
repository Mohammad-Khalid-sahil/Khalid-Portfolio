import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_media_upload_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.STORAGE_PROVIDER = "local";
const testStorageDirectory = path.join(os.tmpdir(), `portfolio-media-upload-test-${process.pid}-${Date.now()}`);
process.env.LOCAL_STORAGE_DIR = testStorageDirectory;

const [{ default: app }, { default: mongoose }, { connectDatabase }, { default: User }, { default: Media }, { default: Profile }] = await Promise.all([
  import("../src/app.js"),
  import("mongoose"),
  import("../src/config/database.js"),
  import("../src/models/User.js"),
  import("../src/models/Media.js"),
  import("../src/models/Profile.js"),
]);

let server;
let baseURL;

async function login() {
  await User.create({ name: "Media Test Admin", email: "media-test-admin@portfolio.dev", password: "ChangeMe123!", role: "admin" });
  const response = await fetch(`${baseURL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "media-test-admin@portfolio.dev", password: "ChangeMe123!" }),
  });
  return (await response.json()).data.accessToken;
}

async function upload(token, { name, type, bytes, route = "/media", usedIn = "other" }) {
  const form = new FormData();
  form.append("usedIn", usedIn);
  form.append("file", new Blob([bytes], { type }), name);
  return fetch(`${baseURL}${route}`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
}

before(async () => {
  await connectDatabase();
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Media.deleteMany({}), Profile.deleteMany({})]);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(testStorageDirectory, { recursive: true, force: true });
});

test("valid image and PDF uploads are stored, listed, and deletable with references cleared", async () => {
  const token = await login();
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const imageResponse = await upload(token, { name: "profile.jpg", type: "image/jpeg", bytes: jpeg, route: "/projects/upload", usedIn: "profile" });
  assert.equal(imageResponse.status, 201);
  const image = (await imageResponse.json()).data;
  assert.match(image.url, /\/uploads\/[\w-]+\.jpg$/);
  const imageFetch = await fetch(image.url);
  assert.equal(imageFetch.status, 200);
  assert.deepEqual(Buffer.from(await imageFetch.arrayBuffer()), jpeg);

  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF");
  const pdfResponse = await upload(token, { name: "resume.pdf", type: "application/pdf", bytes: pdf, usedIn: "resume" });
  assert.equal(pdfResponse.status, 201);
  const pdfMedia = (await pdfResponse.json()).data;
  assert.equal(pdfMedia.category, "document");
  await Profile.create({ name: "Media User", title: "Engineer", tagline: "Builds software", email: "profile@portfolio.dev", resumeUrl: pdfMedia.url });

  const listResponse = await fetch(`${baseURL}/media?category=document&usedIn=resume`, { headers: { authorization: `Bearer ${token}` } });
  const listing = await listResponse.json();
  assert.equal(listing.data.length, 1);
  assert.equal(listing.data[0]._id, pdfMedia._id);
  const usageResponse = await fetch(`${baseURL}/media/${pdfMedia._id}/usage`, { headers: { authorization: `Bearer ${token}` } });
  const usage = await usageResponse.json();
  assert.equal(usage.data.some((entry) => entry.field === "resumeUrl"), true);

  const deleteResponse = await fetch(`${baseURL}/media/${pdfMedia._id}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
  assert.equal(deleteResponse.status, 200);
  const profile = await Profile.findOne();
  assert.equal(profile.resumeUrl, null);
  assert.equal((await fetch(pdfMedia.url)).status, 404);
});

test("rejects invalid extension, invalid MIME, mismatched signatures, and oversized uploads", async () => {
  const token = await login();
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal((await upload(token, { name: "shell.exe", type: "image/png", bytes: png })).status, 400);
  assert.equal((await upload(token, { name: "image.jpg", type: "application/x-msdownload", bytes: png })).status, 400);
  assert.equal((await upload(token, { name: "fake.png", type: "image/png", bytes: Buffer.from("not a PNG") })).status, 400);
  assert.equal((await upload(token, { name: "large.jpg", type: "image/jpeg", bytes: Buffer.alloc(5 * 1024 * 1024 + 1, 0xff) })).status, 400);
  assert.equal(await Media.countDocuments(), 0);
});
