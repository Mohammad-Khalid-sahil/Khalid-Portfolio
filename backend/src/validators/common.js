import { body, param, query } from "express-validator";

/**
 * Validates a route param as a MongoDB ObjectId. Catches malformed IDs
 * before they ever reach a query, returning a consistent 400 "Validation
 * failed" response instead of a CastError-derived 400 with a different
 * shape from the generic error handler.
 */
export function mongoIdParam(field = "id") {
  return param(field).isMongoId().withMessage(`${field} must be a valid ID`);
}

/**
 * Standard pagination query params: page (>=1) and limit (1-100, capped to
 * prevent accidentally/maliciously requesting huge result sets).
 */
export const paginationValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
];

/**
 * Free-text search query param — bounded length so it can't be used to
 * smuggle huge payloads into a $text search.
 */
export const searchValidator = [
  query("search").optional().trim().isLength({ max: 100 }).withMessage("search must be at most 100 characters"),
];

/**
 * A field that, if present, must be empty or a well-formed http(s) URL.
 * Used for optional link fields (github, demo, resumeUrl, verificationUrl...)
 * where an empty string is the "not set" value used throughout the app.
 */
export function optionalUrl(fieldValidator) {
  return fieldValidator
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Must be a valid http(s) URL")
    .isLength({ max: 500 });
}

/**
 * A field that, if present, must be a non-empty string array (or a single
 * string, which controllers normalize to an array) — used for
 * technologies/features/tags-style list inputs.
 */
export function optionalStringArray(fieldValidator) {
  return fieldValidator.optional().custom((value) => {
    if (Array.isArray(value)) {
      return value.every((item) => typeof item === "string" && item.length <= 100);
    }
    return typeof value === "string";
  });
}

/** Validates the additive fa/ps translation maps without changing legacy fields. */
export function localizedTranslations(fields) {
  const allowed = new Set(fields);
  return body("translations").optional().isObject().custom((translations) => {
    for (const [locale, values] of Object.entries(translations)) {
      if (!["fa", "ps"].includes(locale) || !values || typeof values !== "object" || Array.isArray(values)) return false;
      for (const [field, value] of Object.entries(values)) {
        if (!allowed.has(field)) return false;
        if (typeof value === "string") { if (value.length > 50000) return false; continue; }
        if (Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === "string" && item.length <= 500)) continue;
        return false;
      }
    }
    return true;
  }).withMessage("translations must contain only supported locales and translatable fields");
}

/** Shared bounded query validation for admin-backed resource lists. */
export const adminResourceListValidators = [
  ...paginationValidator,
  ...searchValidator,
  query("sort").optional().isIn(["default", "newest", "oldest", "alpha", "alphaDesc", "order"]).withMessage("sort must be a supported resource sort"),
];
