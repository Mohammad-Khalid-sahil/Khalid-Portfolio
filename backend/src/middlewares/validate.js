import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Wraps an array of express-validator chains, runs them, and throws a
 * formatted ApiError if validation fails.
 */
export function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest("Validation failed", details));
  };
}
