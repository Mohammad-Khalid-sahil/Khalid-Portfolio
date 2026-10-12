import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.STORAGE_PROVIDER = "local";
const storageDirectory = path.join(os.tmpdir(), `portfolio-storage-test-${process.pid}-${Date.now()}`);
process.env.LOCAL_STORAGE_DIR = storageDirectory;

const { storeUpload, deleteStoredUpload, getLocalStorageDirectory } = await import("../src/utils/storage.js");

after(async () => {
  await fs.rm(storageDirectory, { recursive: true, force: true });
});

test("stores and serves an upload from the configured local directory", async () => {
  const bytes = Buffer.from("%PDF-1.4 test fixture");
  const stored = await storeUpload(
    { originalname: "resume.pdf", mimetype: "application/pdf", buffer: bytes },
    { protocol: "https", get: () => "portfolio.test" }
  );

  assert.equal(getLocalStorageDirectory(), path.resolve(storageDirectory));
  assert.equal(stored.storageProvider, "local");
  assert.match(stored.url, /^https:\/\/portfolio\.test\/uploads\//);
  assert.deepEqual(await fs.readFile(path.join(storageDirectory, stored.filename)), bytes);

  await deleteStoredUpload(stored);
  await assert.rejects(fs.access(path.join(storageDirectory, stored.filename)), { code: "ENOENT" });
});
