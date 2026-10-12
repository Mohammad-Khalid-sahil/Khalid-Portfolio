import { body } from "express-validator";
import { localizedTranslations } from "./common.js";

export const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 60 }),
  body("slug")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .matches(/^[a-z0-9-]*$/)
    .withMessage("slug may only contain lowercase letters, numbers, and hyphens"),
  localizedTranslations(["name"]),
];

export const updateCategoryValidator = [
  body("name").optional().trim().isLength({ min: 1, max: 60 }),
  body("slug")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .matches(/^[a-z0-9-]*$/)
    .withMessage("slug may only contain lowercase letters, numbers, and hyphens"),
  localizedTranslations(["name"]),
];
