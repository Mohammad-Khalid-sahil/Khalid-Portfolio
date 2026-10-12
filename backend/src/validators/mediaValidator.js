import { query } from "express-validator";

const CATEGORIES = ["image", "document"];
const USED_IN = ["profile", "project", "certification", "blog", "resume", "other"];

export const listMediaValidator = [
  query("search").optional().trim().isLength({ max: 100 }),
  query("category").optional().isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(", ")}`),
  query("usedIn").optional().isIn(USED_IN).withMessage(`usedIn must be one of: ${USED_IN.join(", ")}`),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];
