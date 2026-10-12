import BlogPost from "../models/BlogPost.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { slugify } from "../utils/slugify.js";

function buildPostFilters(query, { publicOnly = false } = {}) {
  const { category, tag, search, status } = query;
  const filter = publicOnly ? { published: true } : {};

  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };
  if (!publicOnly && status && status !== "all") filter.published = status === "published";

  return filter;
}

function buildPostSearchFallback(filter, search) {
  const fallback = { ...filter };
  delete fallback.$text;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  fallback.$or = ["title", "content", "excerpt"].map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  return fallback;
}

function normalizePostPayload(body, user, { create = false } = {}) {
  const payload = { ...body };

  if (payload.slug) payload.slug = slugify(payload.slug);
  if (create && !payload.slug && payload.title) payload.slug = slugify(payload.title);
  if (payload.seoKeywords && typeof payload.seoKeywords === "string") {
    payload.seoKeywords = payload.seoKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  if (!payload.readingTime && payload.content) {
    payload.readingTime = Math.max(1, Math.ceil(payload.content.trim().split(/\s+/).filter(Boolean).length / 200));
  }
  if (payload.published === true && !payload.publishedAt) payload.publishedAt = new Date();
  if (payload.published === false) payload.publishedAt = null;
  if (user && !payload.author) payload.author = user._id;

  return payload;
}

export const getPosts = catchAsync(async (req, res) => {
  const { category, tag, search, page = 1, limit = 9 } = req.query;
  const filter = buildPostFilters({ category, tag, search }, { publicOnly: true });

  const skip = (Number(page) - 1) * Number(limit);
  let posts;
  let total;
  try {
    [posts, total] = await Promise.all([
      BlogPost.find(filter)
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .sort("-publishedAt")
      .skip(skip)
      .limit(Number(limit)),
      BlogPost.countDocuments(filter),
    ]);
  } catch (error) {
    // A newly provisioned MongoDB can briefly lack declared indexes, and
    // some deployments disable automatic index creation. Keep search usable
    // until the text index exists instead of returning an API 500.
    if (error.code !== 27 || !search) throw error;
    const fallback = buildPostSearchFallback(filter, search);
    [posts, total] = await Promise.all([
      BlogPost.find(fallback)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .sort("-publishedAt")
        .skip(skip)
        .limit(Number(limit)),
      BlogPost.countDocuments(fallback),
    ]);
  }

  sendSuccess(res, {
    message: "Blog posts retrieved",
    data: posts,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

export const getAdminPosts = catchAsync(async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const filter = buildPostFilters(req.query);
  const skip = (Number(page) - 1) * Number(limit);

  let posts;
  let total;
  try {
    [posts, total] = await Promise.all([
      BlogPost.find(filter)
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .populate("author", "name avatar")
      .sort(req.query.sort || "-updatedAt")
      .skip(skip)
      .limit(Number(limit)),
      BlogPost.countDocuments(filter),
    ]);
  } catch (error) {
    if (error.code !== 27 || !req.query.search) throw error;
    const fallback = buildPostSearchFallback(filter, req.query.search);
    [posts, total] = await Promise.all([
      BlogPost.find(fallback)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .populate("author", "name avatar")
        .sort(req.query.sort || "-updatedAt")
        .skip(skip)
        .limit(Number(limit)),
      BlogPost.countDocuments(fallback),
    ]);
  }

  sendSuccess(res, {
    message: "Admin blog posts retrieved",
    data: posts,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

export const getPostBySlug = catchAsync(async (req, res) => {
  const post = await BlogPost.findOneAndUpdate(
    { slug: req.params.slug, published: true },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("category", "name slug")
    .populate("tags", "name slug")
    .populate("author", "name avatar");

  if (!post) throw ApiError.notFound("Blog post not found");
  sendSuccess(res, { message: "Blog post retrieved", data: post });
});

export const createPost = catchAsync(async (req, res) => {
  const payload = normalizePostPayload(req.body, req.user, { create: true });
  const post = await BlogPost.create(payload);
  sendSuccess(res, { statusCode: 201, message: "Blog post created", data: post });
});

export const updatePost = catchAsync(async (req, res) => {
  const payload = normalizePostPayload(req.body);
  const post = await BlogPost.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!post) throw ApiError.notFound("Blog post not found");
  sendSuccess(res, { message: "Blog post updated", data: post });
});

export const deletePost = catchAsync(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) throw ApiError.notFound("Blog post not found");
  sendSuccess(res, { message: "Blog post deleted" });
});
