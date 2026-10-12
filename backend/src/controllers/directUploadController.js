import crypto from "node:crypto";
import path from "node:path";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { recordMedia } from "../utils/media.js";
import { createDirectUpload, deleteStoredUpload, inspectDirectUpload } from "../utils/storage.js";
import { hasValidSignature, validateUploadMetadata } from "../middlewares/upload.js";
import Media from "../models/Media.js";
import { createCloudinaryUpload, inspectCloudinaryUpload, verifyCloudinaryResponseSignature } from "../utils/cloudinary.js";

function currentUserId(req) {
  return String(req.user?._id || req.user?.id || "");
}

export const signDirectUpload = catchAsync(async (req, res) => {
  const metadata = validateUploadMetadata(req.body || {});

  if (env.STORAGE_PROVIDER === "cloudinary") {
    const filename = `${Date.now()}-${crypto.randomUUID()}${path.extname(metadata.originalName).toLowerCase()}`;
    const upload = createCloudinaryUpload({ filename, mimeType: metadata.mimeType, target: metadata.uploadTarget });
    const uploadToken = jwt.sign({
      sub: currentUserId(req),
      filename,
      storageKey: upload.publicId,
      storageProvider: "cloudinary",
      resourceType: upload.resourceType,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      usedIn: metadata.usedIn,
      uploadTarget: metadata.uploadTarget,
    }, env.JWT_SECRET, { expiresIn: 300 });
    return sendSuccess(res, {
      message: "Upload authorized",
      data: { mode: "direct", provider: "cloudinary", method: upload.method, uploadUrl: upload.uploadUrl, fields: upload.fields, uploadToken },
    });
  }

  if (env.STORAGE_PROVIDER !== "s3") {
    if (env.NODE_ENV === "production" && process.env.VERCEL === "1") {
      throw ApiError.serviceUnavailable("Direct media storage is not configured.");
    }
    return sendSuccess(res, { message: "Use the local upload endpoint", data: { mode: "multipart" } });
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}${path.extname(metadata.originalName).toLowerCase()}`;
  const upload = createDirectUpload({
    filename,
    key: filename,
    mimeType: metadata.mimeType,
    size: metadata.size,
  });
  const uploadToken = jwt.sign({
    sub: currentUserId(req),
    filename,
    storageKey: filename,
    storageProvider: "s3",
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
    size: metadata.size,
    usedIn: metadata.usedIn,
    uploadTarget: metadata.uploadTarget,
  }, env.JWT_SECRET, { expiresIn: 300 });

  sendSuccess(res, {
    message: "Upload authorized",
    data: {
      mode: "direct",
      method: upload.method,
      uploadUrl: upload.url,
      headers: upload.headers || {},
      fields: upload.fields || {},
      uploadToken,
    },
  });
});

export const completeDirectUpload = catchAsync(async (req, res) => {
  const suppliedToken = req.body?.uploadToken;
  if (typeof suppliedToken !== "string" || !suppliedToken) {
    throw ApiError.badRequest("Upload authorization is required.");
  }

  let claims;
  try {
    claims = jwt.verify(suppliedToken, env.JWT_SECRET);
  } catch {
    throw ApiError.badRequest("Upload authorization is invalid or expired.");
  }

  if (claims.sub !== currentUserId(req)) throw ApiError.forbidden("Upload authorization belongs to another user.");

  const metadata = validateUploadMetadata({
    originalName: claims.originalName,
    mimeType: claims.mimeType,
    size: claims.size,
    usedIn: claims.usedIn,
    uploadTarget: claims.uploadTarget,
  });
  if (claims.storageProvider === "cloudinary") {
    if (!claims.storageKey?.startsWith(`portfolio/${claims.uploadTarget}/`) || !["image", "raw"].includes(claims.resourceType)) {
      throw ApiError.badRequest("Upload authorization is invalid.");
    }
    const uploaded = req.body?.cloudinaryResult || {};
    if (uploaded.public_id !== claims.storageKey || !verifyCloudinaryResponseSignature({
      publicId: uploaded.public_id,
      version: uploaded.version,
      signature: uploaded.signature,
    })) {
      throw ApiError.badRequest("Cloudinary upload response is invalid.");
    }
    if (await Media.exists({ storageKey: claims.storageKey, storageProvider: "cloudinary" })) {
      throw ApiError.conflict("This upload has already been completed.");
    }

    let inspection;
    try {
      inspection = await inspectCloudinaryUpload({
        publicId: claims.storageKey,
        version: uploaded.version,
        signature: uploaded.signature,
        resourceType: claims.resourceType,
        mimeType: metadata.mimeType,
        expectedSize: metadata.size,
      });
    } catch (error) {
      if (/metadata failed validation/.test(error.message)) {
        await deleteStoredUpload({ storageProvider: "cloudinary", storageKey: claims.storageKey, mimeType: metadata.mimeType }).catch(() => {});
        throw ApiError.badRequest("Uploaded file content or size does not match the authorized upload.");
      }
      throw ApiError.serviceUnavailable("Uploaded file could not be verified in Cloudinary.");
    }
    let media;
    try {
      media = await recordMedia({
        req,
        file: { originalname: metadata.originalName, mimetype: metadata.mimeType, size: inspection.size },
        usedIn: metadata.usedIn,
        storedUpload: { filename: claims.filename, storageKey: claims.storageKey, storageProvider: "cloudinary", url: inspection.url },
        preserveStoredOnError: true,
      });
    } catch (error) {
      if (error?.code === 11000) throw ApiError.conflict("This upload has already been completed.");
      throw error;
    }
    return sendSuccess(res, { statusCode: 201, message: "File uploaded", data: media });
  }

  if (claims.storageProvider !== "s3" || claims.storageKey !== claims.filename) {
    throw ApiError.badRequest("Upload authorization is invalid.");
  }

  if (await Media.exists({ storageKey: claims.storageKey, storageProvider: "s3" })) {
    throw ApiError.conflict("This upload has already been completed.");
  }

  let inspection;
  try {
    inspection = await inspectDirectUpload(claims.storageKey);
  } catch {
    throw ApiError.serviceUnavailable("Uploaded file could not be verified in object storage.");
  }

  const storedUpload = {
    filename: claims.filename,
    storageKey: claims.storageKey,
    storageProvider: "s3",
    url: `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${String(claims.storageKey).split("/").map(encodeURIComponent).join("/")}`,
  };
  const validObject = inspection.size === metadata.size
    && inspection.mimeType === metadata.mimeType.toLowerCase()
    && hasValidSignature({ mimetype: metadata.mimeType, buffer: inspection.signature });

  if (!validObject) {
    await deleteStoredUpload(storedUpload).catch(() => {});
    throw ApiError.badRequest("Uploaded file content or size does not match the authorized upload.");
  }

  let media;
  try {
    media = await recordMedia({
      req,
      file: { originalname: metadata.originalName, mimetype: metadata.mimeType, size: metadata.size },
      usedIn: metadata.usedIn,
      storedUpload,
      preserveStoredOnError: true,
    });
  } catch (error) {
    if (error?.code === 11000) throw ApiError.conflict("This upload has already been completed.");
    throw error;
  }
  sendSuccess(res, { statusCode: 201, message: "File uploaded", data: media });
});
