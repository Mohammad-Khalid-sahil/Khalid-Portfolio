import { Router } from "express";
import {
  getEducationList,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/educationController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createEducationValidator, updateEducationValidator } from "../validators/educationValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getEducationList);
router.get("/:id", validate([mongoIdParam("id")]), getEducation);
router.post("/", protect, requirePermission("content:write"), validate(createEducationValidator), createEducation);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  validate([mongoIdParam("id"), ...updateEducationValidator]),
  updateEducation
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteEducation);

export default router;

