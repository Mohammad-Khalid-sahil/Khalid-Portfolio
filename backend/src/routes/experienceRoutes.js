import { Router } from "express";
import {
  getExperiences,
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
} from "../controllers/experienceController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { adminContentJsonParser } from "../middlewares/adminContentJsonParser.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createExperienceValidator, updateExperienceValidator } from "../validators/experienceValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getExperiences);
router.get("/:id", validate([mongoIdParam("id")]), getExperience);
router.post("/", protect, requirePermission("content:write"), ...adminContentJsonParser, validate(createExperienceValidator), createExperience);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  ...adminContentJsonParser,
  validate([mongoIdParam("id"), ...updateExperienceValidator]),
  updateExperience
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteExperience);

export default router;

