import { Router } from "express";
import {
  getTestimonials,
  getAdminTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { optionalProtect, protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createTestimonialValidator, updateTestimonialValidator } from "../validators/testimonialValidator.js";

const router = Router();

router.get("/", getTestimonials);
router.get("/admin/all", protect, requirePermission("content:read"), validate(adminResourceListValidators), getAdminTestimonials);
router.get("/:id", validate([mongoIdParam("id")]), getTestimonial);
router.post("/", validate(createTestimonialValidator), optionalProtect, createTestimonial);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  validate([mongoIdParam("id"), ...updateTestimonialValidator]),
  updateTestimonial
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteTestimonial);

export default router;

