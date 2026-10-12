import Media from "../models/Media.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { recordMedia, findMediaUsage, clearMediaReferences } from "../utils/media.js";
import { deleteStoredUpload } from "../utils/storage.js";

const ALLOWED_USED_IN = new Set(["profile", "project", "certification", "blog", "resume", "other"]);

/** Escapes regex special characters so free-text search can't break the query. */
function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const listMedia = catchAsync(async (req, res) => {
  const { search, category, usedIn, page = 1, limit = 24 } = req.query;
  const filter = {};

  if (search) filter.originalName = { $regex: escapeRegex(search), $options: "i" };
  if (category) filter.category = category;
  if (usedIn) filter.usedIn = usedIn;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Media.find(filter).sort("-createdAt").skip(skip).limit(Number(limit)).populate("uploadedBy", "name"),
    Media.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: "Media retrieved",
    data: items,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

export const uploadMedia = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file was uploaded");

  const usedIn = ALLOWED_USED_IN.has(req.body.usedIn) ? req.body.usedIn : "other";
  const media = await recordMedia({ req, file: req.file, usedIn });

  sendSuccess(res, { statusCode: 201, message: "File uploaded", data: media });
});

export const getMediaUsage = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound("Media not found");

  const usage = await findMediaUsage(media.url);
  sendSuccess(res, { message: "Media usage retrieved", data: usage });
});

export const deleteMedia = catchAsync(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound("Media not found");

  // Clear every reference to this file first, so nothing is left pointing
  // at a URL that's about to 404 — these fields are plain strings, not
  // foreign keys, so this is the only way to keep them in sync.
  const clearedReferences = await clearMediaReferences(media.url);

  // Build the on-disk path from the DB-stored filename only — never from
  // any value supplied directly by the request — so this can't be tricked
  // into deleting an arbitrary path (no user input reaches the filesystem).
  await deleteStoredUpload(media);

  await media.deleteOne();
  sendSuccess(res, { message: "Media deleted", data: { clearedReferences } });
});
