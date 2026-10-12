import { body } from "express-validator";
import { localizedTranslations } from "./common.js";

const SKILL_CATEGORIES = ["frontend", "backend", "database", "mobile", "devops", "tools", "other"];

function baseSkillFields({ requireCore }) {
  return [
    (requireCore ? body("name").notEmpty() : body("name").optional())
      .trim()
      .isLength({ min: 1, max: 60 })
      .withMessage("name is required (max 60 chars)"),
    (requireCore ? body("category").notEmpty() : body("category").optional())
      .isIn(SKILL_CATEGORIES)
      .withMessage(`category must be one of: ${SKILL_CATEGORIES.join(", ")}`),
    body("level").optional().isInt({ min: 0, max: 100 }).withMessage("level must be 0-100").toInt(),
    body("yearsExperience").optional().isFloat({ min: 0, max: 50 }).withMessage("yearsExperience must be 0-50").toFloat(),
    body("description").optional().trim().isLength({ max: 500 }),
    body("relatedProjects").optional().isArray({ max: 20 }).withMessage("relatedProjects must be an array of IDs"),
    body("relatedProjects.*").optional().isMongoId().withMessage("each related project must be a valid ID"),
    body("featured").optional().isBoolean().toBoolean(),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["description"]),
  ];
}

export const createSkillValidator = baseSkillFields({ requireCore: true });
export const updateSkillValidator = baseSkillFields({ requireCore: false });
