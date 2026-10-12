import assert from "node:assert/strict";
import { test } from "node:test";

process.env.NODE_ENV = "test";
process.env.STORAGE_PROVIDER = "s3";
process.env.S3_BUCKET = "portfolio-test-bucket";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-only-access-key";
process.env.S3_SECRET_ACCESS_KEY = "test-only-signing-material";
process.env.S3_PUBLIC_URL = "https://media.test.invalid";
delete process.env.S3_ENDPOINT;

const { createDirectUpload } = await import("../src/utils/storage.js");

test("AWS direct upload is a short-lived, one-time signed PUT without exposing credentials", () => {
  const upload = createDirectUpload({
    filename: "random-file.pdf",
    key: "random-file.pdf",
    mimeType: "application/pdf",
    size: 1234,
  });

  assert.equal(upload.method, "PUT");
  assert.equal(new URL(upload.url).hostname, "portfolio-test-bucket.s3.us-east-1.amazonaws.com");
  assert.equal(upload.publicUrl, "https://media.test.invalid/random-file.pdf");
  assert.equal(upload.headers["Content-Type"], "application/pdf");
  assert.equal(upload.headers["If-None-Match"], "*");
  assert.equal(new URL(upload.url).searchParams.get("X-Amz-Expires"), "300");
  assert.equal(new URL(upload.url).searchParams.get("X-Amz-SignedHeaders"), "content-type;host;if-none-match");
  assert.match(new URL(upload.url).searchParams.get("X-Amz-Signature"), /^[a-f0-9]{64}$/);
  assert.equal(upload.size, 1234);
  assert.equal(JSON.stringify(upload).includes(process.env.S3_SECRET_ACCESS_KEY), false);
});
