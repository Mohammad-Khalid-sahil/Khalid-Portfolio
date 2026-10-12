import { Router } from "express";
import { getTags, getTag, createTag, updateTag, deleteTag } from "../controllers/tagController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createTagValidator, updateTagValidator } from "../validators/tagValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getTags);
router.get("/:id", validate([mongoIdParam("id")]), getTag);
router.post("/", protect, requirePermission("content:write"), validate(createTagValidator), createTag);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  validate([mongoIdParam("id"), ...updateTagValidator]),
  updateTag
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteTag);

export default router;

