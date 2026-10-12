import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import User from "../models/User.js";
import { roleCan } from "../config/rbac.js";

function tokenMatchesSession(decoded, user) {
  const tokenVersion = decoded.sv ?? 0;
  return Number.isInteger(tokenVersion) && tokenVersion >= 0 && tokenVersion === (user.sessionVersion ?? 0);
}

export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.accessToken;

  if (!token) throw ApiError.unauthorized("Authentication required");

  const decoded = jwt.verify(token, env.JWT_SECRET);

  // A validly-signed token should always carry a valid ObjectId subject.
  // Guarding this explicitly keeps every auth failure a consistent 401
  // instead of leaking a 400 CastError from findById on a malformed id.
  if (!mongoose.isValidObjectId(decoded.sub)) {
    throw ApiError.unauthorized("Invalid authentication token");
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized("User no longer exists");
  if (!tokenMatchesSession(decoded, user)) throw ApiError.unauthorized("Authentication session has been revoked");

  req.user = user;
  next();
});

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!roleCan(req.user?.role, permission)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

/** Attach req.user when a valid token is present; continue anonymously otherwise. */
export const optionalProtect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies?.accessToken;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!mongoose.isValidObjectId(decoded.sub)) return next();

    const user = await User.findById(decoded.sub);
    if (user && tokenMatchesSession(decoded, user)) req.user = user;
  } catch {
    // Ignore invalid tokens for optional auth routes.
  }

  next();
});
