import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { adminContentJsonParser } from "../middlewares/adminContentJsonParser.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createCategoryValidator, updateCategoryValidator } from "../validators/categoryValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getCategories);
router.get("/:id", validate([mongoIdParam("id")]), getCategory);
router.post("/", protect, requirePermission("content:write"), ...adminContentJsonParser, validate(createCategoryValidator), createCategory);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  ...adminContentJsonParser,
  validate([mongoIdParam("id"), ...updateCategoryValidator]),
  updateCategory
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteCategory);

export default router;

