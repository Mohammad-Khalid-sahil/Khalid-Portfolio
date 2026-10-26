import { Router } from "express";
import {
  getEducationList,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/educationController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { adminContentJsonParser } from "../middlewares/adminContentJsonParser.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createEducationValidator, updateEducationValidator } from "../validators/educationValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getEducationList);
router.get("/:id", validate([mongoIdParam("id")]), getEducation);
router.post("/", protect, requirePermission("content:write"), ...adminContentJsonParser, validate(createEducationValidator), createEducation);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  ...adminContentJsonParser,
  validate([mongoIdParam("id"), ...updateEducationValidator]),
  updateEducation
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteEducation);

export default router;

