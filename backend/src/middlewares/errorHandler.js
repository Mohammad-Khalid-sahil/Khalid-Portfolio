import { isProd } from "../config/env.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
    details = field ? [{ field, message: "duplicate" }] : null;
  }

  // Malformed ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  if (isProd && statusCode >= 500 && err.isOperational !== true) {
    message = "Internal server error";
    details = null;
  }

  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
