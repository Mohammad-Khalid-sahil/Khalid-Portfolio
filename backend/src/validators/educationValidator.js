import { body } from "express-validator";
import { optionalStringArray, localizedTranslations } from "./common.js";

function baseEducationFields({ requireCore }) {
  return [
    (requireCore ? body("degree").notEmpty() : body("degree").optional())
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("degree is required (max 150 chars)"),
    (requireCore ? body("university").notEmpty() : body("university").optional())
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("university is required (max 150 chars)"),
    body("faculty").optional().trim().isLength({ max: 150 }),
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
    body("gpa").optional().trim().isLength({ max: 20 }),
    optionalStringArray(body("courses")).withMessage("courses must be an array of strings"),
    body("thesis").optional().trim().isLength({ max: 500 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    optionalStringArray(body("achievements")).withMessage("achievements must be an array of strings"),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["degree", "faculty", "courses", "thesis", "description", "achievements"]),
  ];
}

export const createEducationValidator = baseEducationFields({ requireCore: true });
export const updateEducationValidator = baseEducationFields({ requireCore: false });
