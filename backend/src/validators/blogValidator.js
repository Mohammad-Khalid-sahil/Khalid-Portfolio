import { body, query } from "express-validator";
import { localizedTranslations } from "./common.js";

function baseBlogFields({ requireCore }) {
  return [
    (requireCore ? body("title").notEmpty() : body("title").optional())
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("title is required (max 200 chars)"),
    body("slug")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .matches(/^[a-z0-9-]*$/)
      .withMessage("slug may only contain lowercase letters, numbers, and hyphens"),
    (requireCore ? body("content").notEmpty() : body("content").optional())
      .isLength({ min: 1, max: 50000 })
      .withMessage("content is required (max 50000 chars)"),
    body("excerpt").optional().trim().isLength({ max: 500 }),
    body("category").optional({ checkFalsy: true }).isMongoId().withMessage("category must be a valid ID"),
    body("tags").optional().isArray().withMessage("tags must be an array of IDs"),
    body("tags.*").optional().isMongoId().withMessage("each tag must be a valid ID"),
    body("seoTitle").optional().trim().isLength({ max: 200 }),
    body("seoDescription").optional().trim().isLength({ max: 300 }),
    body("seoKeywords")
      .optional()
      .custom((value) => typeof value === "string" || Array.isArray(value))
      .withMessage("seoKeywords must be a string or an array of strings"),
    body("readingTime").optional().isInt({ min: 1, max: 999 }).toInt(),
    body("published").optional().isBoolean().toBoolean(),
    localizedTranslations(["title", "excerpt", "content", "seoTitle", "seoDescription"]),
  ];
}

export const createPostValidator = baseBlogFields({ requireCore: true });
export const updatePostValidator = baseBlogFields({ requireCore: false });

export const listPostsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("category").optional().trim().isLength({ max: 100 }),
  query("tag").optional().trim().isLength({ max: 100 }),
  query("search").optional().trim().isLength({ max: 100 }),
  query("status").optional().isIn(["all", "published", "draft"]).withMessage("status must be all, published, or draft"),
  query("sort").optional().trim().isLength({ max: 50 }),
];
