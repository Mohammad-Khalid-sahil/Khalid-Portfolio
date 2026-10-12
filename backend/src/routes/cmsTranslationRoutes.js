import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { mongoIdParam } from "../validators/common.js";
import { validate } from "../middlewares/validate.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { Router } from "express";
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

router.get("/:resource/:id", protect, requirePermission("content:read"), validate([mongoIdParam("id")]), catchAsync(async (req, res) => {
  const Model = Object.hasOwn(models, req.params.resource) ? models[req.params.resource] : null;
  if (!Model) throw ApiError.notFound("CMS resource not found");
  const document = await Model.findById(req.params.id).select("+translations");
  if (!document) throw ApiError.notFound("CMS resource not found");
  sendSuccess(res, { message: "CMS translations retrieved", data: { translations: document.translations || {} } });
}));

export default router;


