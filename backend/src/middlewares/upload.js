import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const IMAGE_TYPES = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["image/gif", new Set([".gif"])],
]);
const PDF_TYPES = new Map([["application/pdf", new Set([".pdf"])]]);
// Accepted payloads stay in memory only until signature validation finishes, then move to configured storage.
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALL_TYPES = new Map([...IMAGE_TYPES, ...PDF_TYPES]);

export function validateUploadMetadata({ originalName, mimeType, size, usedIn = "other", uploadTarget }) {
  const sanitizedName = path.basename(String(originalName || "").replace(/\\/g, "/"));
  const extension = path.extname(sanitizedName).toLowerCase();
  const acceptedTypes = uploadTarget === "media" || usedIn === "resume" ? ALL_TYPES : IMAGE_TYPES;

  if (!new Set(["media", "project"]).has(uploadTarget)) {
    throw ApiError.badRequest("Upload target is invalid.");
  }
  if (!acceptedTypes.get(mimeType)?.has(extension)) {
    throw ApiError.badRequest("Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, PDF.");
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_SIZE_BYTES) {
    throw ApiError.badRequest("File must be larger than 0 bytes and no larger than 5 MB.");
  }

  const normalizedUsedIn = new Set(["profile", "project", "certification", "blog", "resume", "other"]).has(usedIn)
    ? usedIn
    : "other";
  const safeOriginalName = sanitizedName.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "upload";

  return { originalName: safeOriginalName, mimeType, size, usedIn: normalizedUsedIn, uploadTarget };
}

function fileFilter(req, file, cb) {
  const originalName = path.basename(String(file.originalname || "").replace(/\\/g, "/"));
  const ext = path.extname(originalName).toLowerCase();
  const isMediaLibrary = String(req.baseUrl || "").endsWith("/media");
  const allowedTypes = isMediaLibrary ? ALL_TYPES : req.body?.usedIn === "resume" ? PDF_TYPES : IMAGE_TYPES;
  if (!allowedTypes.get(file.mimetype)?.has(ext)) {
    return cb(ApiError.badRequest(req.body?.usedIn === "resume" ? "Resume must be a PDF file." : "Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, PDF."));
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1, fields: 10, parts: 12 },
});

export function hasValidSignature(file) {
  const bytes = file.buffer;
  switch (file.mimetype) {
    case "image/jpeg": return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp": return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case "image/gif": return bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
    case "application/pdf": return bytes.length >= 5 && bytes.toString("ascii", 0, 5) === "%PDF-";
    default: return false;
  }
}

export function verifyUploadSignature(req, res, next) {
  if (!req.file) return next();
  if (!hasValidSignature(req.file)) return next(ApiError.badRequest("File content does not match its declared type."));
  next();
}

export const uploadError = (err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") return next(ApiError.badRequest("File must be no larger than 5 MB."));
  if (err?.code === "LIMIT_FILE_COUNT" || err?.code === "LIMIT_UNEXPECTED_FILE" || err?.code === "LIMIT_PART_COUNT" || err?.code === "LIMIT_FIELD_COUNT") return next(ApiError.badRequest("Only one file can be uploaded at a time."));
  next(err);
};

export function requireMultipartStorage(req, res, next) {
  if (env.STORAGE_PROVIDER === "cloudinary") {
    return next(ApiError.serviceUnavailable("Use the authorized direct-upload endpoint for media uploads."));
  }
  next();
}

export { upload };

