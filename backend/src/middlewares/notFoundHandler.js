import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
