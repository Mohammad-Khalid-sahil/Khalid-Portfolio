import { body } from "express-validator";
import { optionalUrl, localizedTranslations } from "./common.js";

function baseCertificationFields({ requireCore }) {
  return [
    (requireCore ? body("name").notEmpty() : body("name").optional())
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("name is required (max 150 chars)"),
    (requireCore ? body("organization").notEmpty() : body("organization").optional())
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("organization is required (max 150 chars)"),
    (requireCore ? body("date").notEmpty() : body("date").optional())
      .isISO8601()
      .withMessage("date must be a valid date")
      .toDate(),
    body("credentialId").optional().trim().isLength({ max: 100 }),
    optionalUrl(body("image")),
    body("description").optional().trim().isLength({ max: 1000 }),
    optionalUrl(body("verificationUrl")),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["name", "description"]),
  ];
}

export const createCertificationValidator = baseCertificationFields({ requireCore: true });
export const updateCertificationValidator = baseCertificationFields({ requireCore: false });
