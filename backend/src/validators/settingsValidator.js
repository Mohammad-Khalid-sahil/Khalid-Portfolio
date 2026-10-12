import { body } from "express-validator";
import { optionalUrl } from "./common.js";

const LANGUAGES = ["en", "fa", "ps"];

export const updateSettingsValidator = [
  body("siteTitle").optional().trim().isLength({ min: 1, max: 150 }),
  body("siteDescription").optional().trim().isLength({ max: 500 }),
  body("defaultLanguage").optional().isIn(LANGUAGES).withMessage(`defaultLanguage must be one of: ${LANGUAGES.join(", ")}`),
  body("supportedLanguages").optional().isArray({ max: 10 }),
  body("supportedLanguages.*").optional().isIn(LANGUAGES),
  body("maintenanceMode").optional().isBoolean().toBoolean(),

  optionalUrl(body("seo.siteUrl")),
  body("seo.metaTitle").optional().trim().isLength({ max: 200 }),
  body("seo.metaDescription").optional().trim().isLength({ max: 300 }),
  body("seo.keywords").optional().isArray({ max: 30 }),
  body("seo.keywords.*").optional().trim().isLength({ max: 50 }),
  optionalUrl(body("seo.ogImage")),
];
