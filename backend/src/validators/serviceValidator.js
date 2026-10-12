import { body } from "express-validator";
import { optionalStringArray, localizedTranslations } from "./common.js";

function baseServiceFields({ requireCore }) {
  return [
    (requireCore ? body("title").notEmpty() : body("title").optional())
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("title is required (max 100 chars)"),
    (requireCore ? body("description").notEmpty() : body("description").optional())
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("description is required (max 500 chars)"),
    body("icon").optional().trim().isLength({ max: 50 }),
    optionalStringArray(body("features")).withMessage("features must be an array of short strings"),
    optionalStringArray(body("technologies")).withMessage("technologies must be an array of short strings"),
    body("startingPrice").optional().trim().isLength({ max: 50 }),
    body("ctaText").optional().trim().isLength({ max: 60 }),
    body("featured").optional().isBoolean().toBoolean(),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["title", "description", "features", "ctaText"]),
  ];
}

export const createServiceValidator = baseServiceFields({ requireCore: true });
export const updateServiceValidator = baseServiceFields({ requireCore: false });
