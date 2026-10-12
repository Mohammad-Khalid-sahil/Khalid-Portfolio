import { body } from "express-validator";
import { optionalStringArray, localizedTranslations } from "./common.js";

function baseExperienceFields({ requireCore }) {
  return [
    (requireCore ? body("position").notEmpty() : body("position").optional())
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage("position is required (max 120 chars)"),
    (requireCore ? body("company").notEmpty() : body("company").optional())
      .trim()
      .isLength({ min: 1, max: 120 })
      .withMessage("company is required (max 120 chars)"),
    body("location").optional().trim().isLength({ max: 120 }),
    body("isCurrent").optional().isBoolean().withMessage("isCurrent must be true or false").toBoolean(),
    body("description").optional().trim().isLength({ max: 1000 }),
    (requireCore ? body("startDate").notEmpty() : body("startDate").optional())
      .isISO8601()
      .withMessage("startDate must be a valid date")
      .toDate(),
    body("endDate")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .withMessage("endDate must be a valid date")
      .toDate()
      .custom((endDate, { req }) => {
        if (req.body.startDate && endDate < new Date(req.body.startDate)) {
          throw new Error("endDate cannot be before startDate");
        }
        return true;
      }),
    optionalStringArray(body("responsibilities")).withMessage("responsibilities must be an array of strings"),
    optionalStringArray(body("achievements")).withMessage("achievements must be an array of strings"),
    optionalStringArray(body("technologies")).withMessage("technologies must be an array of strings"),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["position", "description", "responsibilities", "achievements"]),
  ];
}

export const createExperienceValidator = baseExperienceFields({ requireCore: true });
export const updateExperienceValidator = baseExperienceFields({ requireCore: false });
