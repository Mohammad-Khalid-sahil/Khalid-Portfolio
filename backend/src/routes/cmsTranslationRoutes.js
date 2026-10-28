import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { mongoIdParam } from "../validators/common.js";
import { validate } from "../middlewares/validate.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { Router } from "express";
import express from "express";
import { roleCan } from "../config/rbac.js";
import { sanitizeInput } from "../middlewares/sanitize.js";
import { translateCmsContent } from "../services/freeTranslationService.js";
import Project from "../models/Project.js";
import Skill from "../models/Skill.js";
import Service from "../models/Service.js";
import Experience from "../models/Experience.js";
import Education from "../models/Education.js";
import Certification from "../models/Certification.js";
import Testimonial from "../models/Testimonial.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import BlogPost from "../models/BlogPost.js";

const models = { projects: Project, skills: Skill, services: Service, experiences: Experience, education: Education, certifications: Certification, testimonials: Testimonial, categories: Category, tags: Tag, blog: BlogPost, posts: BlogPost };
const router = Router();
const translationJsonParser = express.json({ limit: "1mb" });

const translatableFields = {
  projects: ["title", "description", "fullDescription", "features", "challenges", "solutions", "architecture", "security", "performance", "results", "lessonsLearned", "seoTitle", "seoDescription"],
  skills: ["description"],
  services: ["title", "description", "features", "ctaText"],
  experiences: ["position", "description", "responsibilities", "achievements"],
  education: ["degree", "faculty", "courses", "thesis", "description", "achievements"],
  certifications: ["name", "description"],
  testimonials: ["position", "message"],
  categories: ["name"],
  tags: ["name"],
  blog: ["title", "excerpt", "content", "seoTitle", "seoDescription"],
  profile: ["title", "tagline", "bio", "specialization", "careerGoals", "interests"],
  settings: ["siteDescription", "metaTitle", "metaDescription", "keywords"],
};

function canTranslate(req, res, next) {
  if (["content:write", "profile:write", "settings:write"].some((permission) => roleCan(req.user?.role, permission))) return next();
  return next(ApiError.forbidden("You do not have permission to translate content"));
}

router.post("/translate", protect, canTranslate, translationJsonParser, sanitizeInput, catchAsync(async (req, res) => {
  const { resource, content } = req.body || {};
  const allowed = translatableFields[resource];
  if (!allowed || !content || typeof content !== "object" || Array.isArray(content)) {
    throw ApiError.badRequest("Unsupported translation request");
  }
  const entries = Object.entries(content);
  if (!entries.length || entries.length > allowed.length || entries.some(([key]) => !allowed.includes(key))) {
    throw ApiError.badRequest("Unsupported translation fields");
  }
  let totalCharacters = 0;
  const cleanContent = {};
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      totalCharacters += value.length;
      if (value.length > 50000) throw ApiError.badRequest("Translation text is too long");
      cleanContent[key] = value;
    } else if (Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === "string" && item.length <= 2000)) {
      totalCharacters += value.reduce((sum, item) => sum + item.length, 0);
      cleanContent[key] = value;
    } else {
      throw ApiError.badRequest("Translation values must be text or text lists");
    }
  }
  if (totalCharacters > 60000) throw ApiError.badRequest("Translation request is too large");

  let translations;
  try {
    translations = await translateCmsContent(cleanContent);
  } catch {
    throw ApiError.serviceUnavailable("Free automatic translation is temporarily unavailable or its daily quota has been reached");
  }
  sendSuccess(res, { message: "Content translated", data: { translations: { fa: translations.fa, ps: translations.ps } } });
}));

router.get("/:resource/:id", protect, requirePermission("content:read"), validate([mongoIdParam("id")]), catchAsync(async (req, res) => {
  const Model = Object.hasOwn(models, req.params.resource) ? models[req.params.resource] : null;
  if (!Model) throw ApiError.notFound("CMS resource not found");
  const document = await Model.findById(req.params.id).select("+translations");
  if (!document) throw ApiError.notFound("CMS resource not found");
  sendSuccess(res, { message: "CMS translations retrieved", data: { translations: document.translations || {} } });
}));

export default router;


