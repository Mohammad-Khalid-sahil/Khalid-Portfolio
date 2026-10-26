import { Router } from "express";
import { getSkills, getSkill, createSkill, updateSkill, deleteSkill } from "../controllers/skillController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { adminContentJsonParser } from "../middlewares/adminContentJsonParser.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createSkillValidator, updateSkillValidator } from "../validators/skillValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getSkills);
router.get("/:id", validate([mongoIdParam("id")]), getSkill);
router.post("/", protect, requirePermission("content:write"), ...adminContentJsonParser, validate(createSkillValidator), createSkill);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  ...adminContentJsonParser,
  validate([mongoIdParam("id"), ...updateSkillValidator]),
  updateSkill
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteSkill);

export default router;

