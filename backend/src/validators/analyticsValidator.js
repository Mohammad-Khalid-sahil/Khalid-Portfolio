import { body } from "express-validator";

export const trackEventValidator = [
  body("path")
    .trim()
    .notEmpty()
    .withMessage("path is required")
    .isLength({ max: 300 })
    .withMessage("path must be at most 300 characters")
    .matches(/^\//)
    .withMessage("path must start with /"),
  body("referrer").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("eventType").optional().isIn(["page_view", "project_view", "blog_view"]),
  body("contentType").optional().isIn(["page", "project", "blog"]),
  body("contentId").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body("contentTitle").optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body("sessionId")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .matches(/^[a-zA-Z0-9-_]*$/)
    .withMessage("sessionId contains invalid characters"),
];
