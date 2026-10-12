import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import { deleteCloudinaryUpload } from "./cloudinary.js";

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function signingKey(dateStamp) {
  const dateKey = hmac(`AWS4${env.S3_SECRET_ACCESS_KEY}`, dateStamp);
  const regionKey = crypto.createHmac("sha256", dateKey).update(env.S3_REGION).digest();
  const serviceKey = crypto.createHmac("sha256", regionKey).update("s3").digest();
  return crypto.createHmac("sha256", serviceKey).update("aws4_request").digest();
}

function encodeQueryComponent(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function objectUrl(key) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  if (env.S3_ENDPOINT) {
    const url = new URL(env.S3_ENDPOINT);
    url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(env.S3_BUCKET)}/${encodedKey}`;
    return url;
  }
  return new URL(`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${encodedKey}`);
}

export function createDirectUpload({ filename, key, mimeType, size }) {
  const url = objectUrl(key);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${env.S3_REGION}/s3/aws4_request`;
  const credential = `${env.S3_ACCESS_KEY_ID}/${scope}`;
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const query = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": "content-type;host;if-none-match",
  };
  if (env.S3_SESSION_TOKEN) query["X-Amz-Security-Token"] = env.S3_SESSION_TOKEN;
  const canonicalQuery = Object.keys(query).sort()
    .map((name) => `${encodeQueryComponent(name)}=${encodeQueryComponent(query[name])}`)
    .join("&");
  const canonicalHeaders = `content-type:${mimeType}\nhost:${url.host}\nif-none-match:*\n`;
  const signedHeaders = "content-type;host;if-none-match";
  const canonicalRequest = ["PUT", url.pathname, canonicalQuery, canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", signingKey(dateStamp)).update(stringToSign).digest("hex");
  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    method: "PUT",
    url: url.toString(),
    headers: { "Content-Type": mimeType, "If-None-Match": "*" },
    expiresAt,
    filename,
    storageKey: key,
    storageProvider: "s3",
    publicUrl: `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`,
    size,
  };
}

async function s3Request(method, key, body, contentType, additionalHeaders = {}) {
  const url = objectUrl(key);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const headers = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  for (const [name, value] of Object.entries(additionalHeaders)) headers[name.toLowerCase()] = value;
  if (env.S3_SESSION_TOKEN) headers["x-amz-security-token"] = env.S3_SESSION_TOKEN;
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name].trim()}`).join("\n");
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${env.S3_REGION}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", signingKey(dateStamp)).update(stringToSign).digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${env.S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(url, {
    method,
    headers,
    body: method === "PUT" ? body : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Object storage ${method} failed (${response.status}).`);
  return response;
}

export async function inspectDirectUpload(key) {
  const head = await s3Request("HEAD", key, Buffer.alloc(0));
  const size = Number(head.headers.get("content-length"));
  const mimeType = head.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
  const response = await s3Request("GET", key, Buffer.alloc(0), undefined, { range: "bytes=0-11" });
  return { size, mimeType, signature: Buffer.from(await response.arrayBuffer()) };
}

export async function storeUpload(file, req) {
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const key = filename;

  if (env.STORAGE_PROVIDER === "s3") {
    await s3Request("PUT", key, file.buffer, file.mimetype);
    return {
      filename,
      storageKey: key,
      storageProvider: "s3",
      url: `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`,
    };
  }

  if (env.STORAGE_PROVIDER === "cloudinary") {
    throw new Error("Cloudinary uploads must use the authorized direct-upload flow.");
  }

  await fs.mkdir(env.LOCAL_STORAGE_DIR, { recursive: true });
  const filePath = path.join(env.LOCAL_STORAGE_DIR, filename);
  await fs.writeFile(filePath, file.buffer, { flag: "wx", mode: 0o640 });
  return {
    filename,
    storageKey: filename,
    storageProvider: "local",
    path: filePath,
    url: `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(filename)}`,
  };
}

export async function deleteStoredUpload(media) {
  const provider = media.storageProvider || "local";
  const key = media.storageKey || media.filename;
  if (provider === "cloudinary") {
    await deleteCloudinaryUpload({ ...media, storageKey: key });
    return;
  }
  if (provider === "s3") {
    if (env.STORAGE_PROVIDER !== "s3") throw new Error("Cannot delete an S3 object unless STORAGE_PROVIDER=s3 is configured.");
    await s3Request("DELETE", key, Buffer.alloc(0));
    return;
  }
  if (provider !== "local") throw new Error(`Unsupported media storage provider: ${provider}`);

  const filename = path.basename(String(key || ""));
  if (!filename || filename !== key || filename === "." || filename === "..") throw new Error("Stored media filename is invalid.");
  const filePath = path.resolve(env.LOCAL_STORAGE_DIR, filename);
  if (path.dirname(filePath) !== path.resolve(env.LOCAL_STORAGE_DIR)) throw new Error("Stored media path is outside the local storage directory.");
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function getLocalStorageDirectory() {
  return path.resolve(env.LOCAL_STORAGE_DIR);
}



