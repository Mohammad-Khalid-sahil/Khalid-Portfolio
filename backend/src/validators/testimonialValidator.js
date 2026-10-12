import { body } from "express-validator";
import { localizedTranslations } from "./common.js";

export const createTestimonialValidator = [
  body("name").trim().notEmpty().withMessage("name is required").isLength({ max: 100 }),
  body("position").optional().trim().isLength({ max: 100 }),
  body("company").optional().trim().isLength({ max: 100 }),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ min: 5, max: 1000 })
    .withMessage("message must be 5-1000 characters"),
  body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("rating must be 1-5").toInt(),
  localizedTranslations(["position", "message"]),
];

export const updateTestimonialValidator = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }),
  body("position").optional().trim().isLength({ max: 100 }),
  body("company").optional().trim().isLength({ max: 100 }),
  body("message").optional().trim().isLength({ min: 5, max: 1000 }),
  body("rating").optional().isInt({ min: 1, max: 5 }).toInt(),
  body("approved").optional().isBoolean().toBoolean(),
  body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
  localizedTranslations(["position", "message"]),
];
