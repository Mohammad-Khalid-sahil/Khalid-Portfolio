import { body, query } from "express-validator";
import { optionalUrl, optionalStringArray, localizedTranslations, paginationValidator } from "./common.js";

const PROJECT_CATEGORIES = ["web", "mobile", "backend", "ai", "ui-ux", "other"];

function baseProjectFields({ requireCore }) {
  const req = (chain) => (requireCore ? chain.notEmpty() : chain.optional());

  return [
    req(body("title")).trim().isLength({ min: 1, max: 150 }).withMessage("title is required (max 150 chars)"),
    body("slug")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .matches(/^[a-z0-9-]*$/)
      .withMessage("slug may only contain lowercase letters, numbers, and hyphens"),
    req(body("description"))
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("description is required (max 500 chars)"),
    body("fullDescription").optional().trim().isLength({ max: 5000 }),
    body("seoTitle").optional().trim().isLength({ max: 200 }),
    body("seoDescription").optional().trim().isLength({ max: 300 }),
    body("seoKeywords")
      .optional()
      .custom((value) => Array.isArray(value) || typeof value === "string")
      .withMessage("seoKeywords must be a string or an array of strings"),
    body("seoKeywords.*").optional().trim().isLength({ max: 50 }),
    body("category").optional().isIn(PROJECT_CATEGORIES).withMessage(`category must be one of: ${PROJECT_CATEGORIES.join(", ")}`),
    // Project thumbnails are produced by the upload endpoint and should
    // not be treated as a manually-entered link. Accept a string (the
    // uploaded file URL) but do not enforce http(s) URL syntax here so
    // admins can use the upload-only workflow without seeing URL errors.
    body("thumbnail").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("gallery").optional().isArray({ max: 20 }).withMessage("gallery must be an array of image URLs"),
    body("gallery.*")
      .optional()
      // Local development uploads are returned as http://localhost:PORT URLs.
      // Accept that same http(s) URL shape while still requiring a protocol.
      .isURL({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
      .withMessage("each gallery item must be a valid http(s) URL"),
    optionalStringArray(body("technologies")).withMessage("technologies must be an array of short strings"),
    optionalStringArray(body("features")).withMessage("features must be an array of short strings"),
    body("challenges").optional().trim().isLength({ max: 2000 }),
    body("solutions").optional().trim().isLength({ max: 2000 }),
    body("architecture").optional().trim().isLength({ max: 3000 }),
    body("security").optional().trim().isLength({ max: 2000 }),
    body("performance").optional().trim().isLength({ max: 2000 }),
    body("results").optional().trim().isLength({ max: 2000 }),
    body("lessonsLearned").optional().trim().isLength({ max: 2000 }),
    optionalUrl(body("github")),
    optionalUrl(body("demo")),
    optionalUrl(body("videoDemo")),
    optionalUrl(body("documentation")),
    body("featured").optional().isBoolean().toBoolean(),
    body("published").optional().isBoolean().toBoolean(),
    body("order").optional().isInt({ min: 0, max: 10000 }).toInt(),
    localizedTranslations(["title", "description", "fullDescription", "seoTitle", "seoDescription", "features", "challenges", "solutions", "architecture", "security", "performance", "results", "lessonsLearned"]),
  ];
}

export const createProjectValidator = baseProjectFields({ requireCore: true });
export const updateProjectValidator = baseProjectFields({ requireCore: false });

export const listProjectsValidator = [
  ...paginationValidator,
  query("sort").optional().isIn(["default", "newest", "oldest", "alpha", "alphaDesc", "order"]).withMessage("sort must be a supported project sort"),
  query("category")
    .optional()
    .isIn([...PROJECT_CATEGORIES, "all"])
    .withMessage(`category must be one of: all, ${PROJECT_CATEGORIES.join(", ")}`),
  query("featured").optional().isBoolean().withMessage("featured must be true or false"),
  query("search").optional().trim().isLength({ max: 100 }),
];

