import crypto from "node:crypto";
import { env } from "../config/env.js";
import { MAX_FILE_SIZE_BYTES } from "../middlewares/upload.js";

const IMAGE_FORMATS = "jpg,jpeg,png,webp,gif";
const PDF_FORMATS = "pdf";

function sha1(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

export function cloudinaryResourceType(mimeType) {
  return mimeType === "application/pdf" ? "raw" : "image";
}

function signedParameters(parameters) {
  const serialized = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return sha1(`${serialized}${env.CLOUDINARY_API_SECRET}`);
}

export function createCloudinaryUpload({ filename, mimeType, target }) {
  const resourceType = cloudinaryResourceType(mimeType);
  const extension = mimeType === "application/pdf" ? ".pdf" : "";
  const publicId = `portfolio/${target}/${filename.replace(/\.[^.]+$/, "")}${extension}`;
  const parameters = {
    timestamp: Math.floor(Date.now() / 1000),
    public_id: publicId,
    asset_folder: `portfolio/${target}`,
    overwrite: "false",
    allowed_formats: mimeType === "application/pdf" ? PDF_FORMATS : IMAGE_FORMATS,
  };
  const signature = signedParameters(parameters);

  return {
    method: "POST",
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    fields: { ...parameters, api_key: env.CLOUDINARY_API_KEY, signature },
    publicId,
    resourceType,
  };
}

export function verifyCloudinaryResponseSignature({ publicId, version, signature }) {
  if (typeof publicId !== "string" || !publicId || !Number.isSafeInteger(Number(version)) || typeof signature !== "string") return false;
  const expected = sha1(`public_id=${publicId}&version=${version}${env.CLOUDINARY_API_SECRET}`);
  const received = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}

async function cloudinaryAdminRequest(resourceType, publicId, options = {}) {
  const encodedPublicId = encodeURIComponent(publicId);
  const url = options.destroy
    ? `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`
    : `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/${resourceType}/upload/${encodedPublicId}`;
  const headers = {
    authorization: `Basic ${Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString("base64")}`,
  };
  const timestamp = Math.floor(Date.now() / 1000);
  const destroyParameters = { public_id: publicId, timestamp };
  const response = await fetch(url, {
    method: options.destroy ? "POST" : "GET",
    headers: options.destroy ? { ...headers, "content-type": "application/x-www-form-urlencoded" } : headers,
    body: options.destroy ? new URLSearchParams({ ...destroyParameters, signature: signedParameters(destroyParameters) }) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Cloudinary request failed (${response.status}).`);
  return response.json();
}

export async function inspectCloudinaryUpload({ publicId, version, signature, resourceType, mimeType, expectedSize }) {
  if (!verifyCloudinaryResponseSignature({ publicId, version, signature })) throw new Error("Cloudinary response signature is invalid.");
  const asset = await cloudinaryAdminRequest(resourceType, publicId);
  const expectedFolder = publicId.slice(0, publicId.lastIndexOf("/"));
  const expectedFormats = mimeType === "application/pdf" ? new Set(["pdf"]) : new Set(["jpg", "jpeg", "png", "webp", "gif"]);
  const url = new URL(asset.secure_url || "https://invalid.invalid");
  if (asset.public_id !== publicId || asset.resource_type !== resourceType || asset.asset_folder !== expectedFolder
    || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > MAX_FILE_SIZE_BYTES || asset.bytes !== expectedSize
    || !expectedFormats.has(String(asset.format || "").toLowerCase()) || url.protocol !== "https:"
    || url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/`)) {
    throw new Error("Cloudinary asset metadata failed validation.");
  }
  return { size: asset.bytes, url: asset.secure_url };
}

export async function deleteCloudinaryUpload(media) {
  const resourceType = cloudinaryResourceType(media.mimeType);
  const result = await cloudinaryAdminRequest(resourceType, media.storageKey, { destroy: true });
  if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloudinary asset deletion failed.");
}
