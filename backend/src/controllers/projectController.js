import Project from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { slugify } from "../utils/slugify.js";
import { recordMedia } from "../utils/media.js";
import { localizeCmsContent } from "../utils/cmsLocalization.js";

function projectSort(value) {
  return ({ default: "order -createdAt", order: "order -createdAt", newest: "-createdAt", oldest: "createdAt", alpha: "title", alphaDesc: "-title" })[value] || "order -createdAt";
}

function buildProjectSearchFallback(filter, search) {
  const fallback = { ...filter };
  delete fallback.$text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  fallback.$or = ["title", "description", "technologies", "seoKeywords"].map((field) => ({
    [field]: { $regex: escaped, $options: "i" },
  }));
  return fallback;
}

async function listProjects(filter, search, query) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 100;
  const paginated = query.page !== undefined || query.limit !== undefined;
  const skip = paginated ? (page - 1) * limit : 0;
  const effectiveFilter = search ? buildProjectSearchFallback(filter, search) : filter;
  const docsQuery = Project.find(effectiveFilter).select("+translations").sort(projectSort(query.sort));
  if (paginated) docsQuery.skip(skip).limit(limit);
  const [projects, total] = await Promise.all([docsQuery, Project.countDocuments(effectiveFilter)]);
  const meta = paginated ? { total, page, limit, pages: Math.ceil(total / limit) } : { count: total };
  return { projects, meta };
}

export const getProjects = catchAsync(async (req, res) => {
  const { category, featured, search } = req.query;
  const filter = { published: true };
  if (category && category !== "all") filter.category = category;
  if (featured) filter.featured = featured === "true";

  const { projects, meta } = await listProjects(filter, search, req.query);
  sendSuccess(res, { message: "Projects retrieved", data: localizeCmsContent(projects, req.query.locale), meta });
});

export const getAdminProjects = catchAsync(async (req, res) => {
  const { category, featured, search } = req.query;
  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (featured) filter.featured = featured === "true";

  const { projects, meta } = await listProjects(filter, search, req.query);
  sendSuccess(res, { message: "Admin projects retrieved", data: localizeCmsContent(projects, req.query.locale), meta });
});

function normalizeProjectPayload(body) {
  const payload = { ...body };
  if (payload.seoKeywords && typeof payload.seoKeywords === "string") {
    payload.seoKeywords = payload.seoKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  return payload;
}

export const getProjectBySlug = catchAsync(async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug, published: true }).select("+translations");
  if (!project) throw ApiError.notFound("Project not found");

  // Related projects: same category, published, excluding this project —
  // computed on read so it's always in sync with the current catalog and
  // never needs a manually-curated relation field to go stale.
  const relatedProjects = await Project.find({
    _id: { $ne: project._id },
    category: project.category,
    published: true,
  })
    .sort("order -createdAt")
    .limit(4)
    .select("title slug thumbnail description technologies category");

  const localizedProject = localizeCmsContent(project, req.query.locale);
  sendSuccess(res, {
    message: "Project retrieved",
    data: { ...localizedProject, relatedProjects: localizeCmsContent(relatedProjects, req.query.locale) },
  });
});

export const createProject = catchAsync(async (req, res) => {
  const payload = normalizeProjectPayload(req.body);
  if (!payload.slug) payload.slug = slugify(payload.title);
  const project = await Project.create(payload);
  sendSuccess(res, { statusCode: 201, message: "Project created", data: project });
});

export const updateProject = catchAsync(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, normalizeProjectPayload(req.body), {
    new: true,
    runValidators: true,
  });
  if (!project) throw ApiError.notFound("Project not found");
  sendSuccess(res, { message: "Project updated", data: project });
});

export const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");
  sendSuccess(res, { message: "Project deleted" });
});

/**
 * Handles a single image upload (thumbnail or one gallery image) for a
 * project. Returns an absolute URL (built from the request host) so it
 * works correctly regardless of which origin the frontend is served from.
 */
const ALLOWED_USED_IN = new Set(["profile", "project", "certification", "blog", "resume", "other"]);

export const uploadProjectImage = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file was uploaded");

  // Optional tag so the Media Library can categorize where an upload came
  // from; any caller that doesn't send it (all pre-existing callers) still
  // works exactly as before, just filed under "other".
  const usedIn = ALLOWED_USED_IN.has(req.body.usedIn) ? req.body.usedIn : "other";
  const media = await recordMedia({ req, file: req.file, usedIn });

  sendSuccess(res, { statusCode: 201, message: "Image uploaded", data: { url: media.url, mediaId: media._id } });
});
