import express, { Router } from "express";
import {
  getProjects,
  getAdminProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
} from "../controllers/projectController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { sanitizeInput } from "../middlewares/sanitize.js";
import { validate } from "../middlewares/validate.js";
import { upload, uploadError, verifyUploadSignature, requireMultipartStorage } from "../middlewares/upload.js";
import { mongoIdParam } from "../validators/common.js";
import {
  createProjectValidator,
  updateProjectValidator,
  listProjectsValidator,
} from "../validators/projectValidator.js";

const router = Router();
const projectJsonParser = express.json({ limit: "2mb" });

router.get("/", validate(listProjectsValidator), getProjects);
router.get(
  "/admin/all",
  protect,
  requirePermission("content:read"),
  validate(listProjectsValidator),
  getAdminProjects
);
router.post(
  "/upload",
  protect,
  requirePermission("media:write"),
  requireMultipartStorage,
  upload.single("file"),
  uploadError,
  verifyUploadSignature,
  uploadProjectImage
);
router.get("/:slug", getProjectBySlug);
router.post("/", protect, requirePermission("content:write"), projectJsonParser, sanitizeInput, validate(createProjectValidator), createProject);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  projectJsonParser,
  sanitizeInput,
  validate([mongoIdParam("id"), ...updateProjectValidator]),
  updateProject
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteProject);

export default router;




