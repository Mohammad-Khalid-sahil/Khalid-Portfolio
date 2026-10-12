import { body } from "express-validator";
import { optionalUrl, localizedTranslations } from "./common.js";

export const updateProfileValidator = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("name must be 1-100 characters"),
  body("title").optional().trim().isLength({ min: 1, max: 150 }).withMessage("title must be 1-150 characters"),
  body("tagline").optional().trim().isLength({ min: 1, max: 250 }).withMessage("tagline must be 1-250 characters"),
  body("bio").optional().trim().isLength({ max: 3000 }).withMessage("bio must be at most 3000 characters"),
  body("specialization").optional().trim().isLength({ max: 200 }),
  body("careerGoals").optional().trim().isLength({ max: 1000 }),
  body("interests").optional().isArray({ max: 30 }).withMessage("interests must be an array of strings"),
  body("interests.*").optional().trim().isLength({ max: 40 }),
  body("languages").optional().isArray({ max: 20 }).withMessage("languages must be an array"),
  body("languages.*.name").trim().isLength({ min: 1, max: 40 }).withMessage("language name is required"),
  body("languages.*.level").optional().trim().isLength({ max: 40 }),
  body("location").optional().trim().isLength({ max: 150 }),
  body("availability").optional().isBoolean().withMessage("availability must be true or false").toBoolean(),
  body("email").optional().trim().isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("phone").optional().trim().isLength({ max: 30 }),
  optionalUrl(body("avatar")),
  optionalUrl(body("resumeUrl")),

  optionalUrl(body("social.github")),
  optionalUrl(body("social.whatsapp")),
  optionalUrl(body("social.linkedin")),
  optionalUrl(body("social.telegram")),
  optionalUrl(body("social.facebook")),
  optionalUrl(body("social.instagram")),
  body("socialSettings").optional().isArray({ max: 4 }).withMessage("socialSettings must contain at most four platforms")
    .custom((rows) => new Set(rows.map((row) => row?.platform)).size === rows.length)
    .withMessage("Social platforms must be unique"),
  body("socialSettings.*.platform").optional().isIn(["github", "facebook", "whatsapp", "telegram"]),
  body("socialSettings.*.enabled").optional().isBoolean().withMessage("enabled must be true or false").toBoolean(),
  body("socialSettings.*.order").optional().isInt({ min: 0, max: 99 }).withMessage("order must be 0-99").toInt(),
  body("socialSettings").optional().custom((rows, { req }) => rows.every((row) => !row.enabled || Boolean(req.body.social?.[row.platform]?.trim())))
    .withMessage("An enabled social platform must have a URL"),

  body("stats").optional().isArray({ max: 12 }).withMessage("stats must be an array"),
  body("stats.*.label").optional().trim().isLength({ min: 1, max: 60 }),
  body("stats.*.value").optional().isNumeric().withMessage("stats value must be a number"),
  body("stats.*.suffix").optional().trim().isLength({ max: 10 }),
  localizedTranslations(["title", "tagline", "bio", "specialization", "careerGoals", "interests"]),
];
