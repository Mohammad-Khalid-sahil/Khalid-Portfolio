import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { env, isProd } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

function signAccessToken(user) {
  return jwt.sign({ sub: user._id, role: user.role, sv: user.sessionVersion ?? 0 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id, jti: crypto.randomUUID(), sv: user.sessionVersion ?? 0 }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "strict",
    maxAge: env.JWT_REFRESH_EXPIRES_IN_MS,
  };
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  const { maxAge, ...options } = getRefreshCookieOptions();
  res.clearCookie("refreshToken", options);
}

export const login = catchAsync(async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshTokenHash +sessionVersion");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const version = user.sessionVersion ?? 0;
  const versionFilter = version === 0
    ? { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] }
    : { sessionVersion: version };
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, ...versionFilter },
    { $set: { refreshTokenHash: hashToken(refreshToken), lastLoginAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!updatedUser) throw ApiError.unauthorized("Authentication session changed; please sign in again");

  setRefreshCookie(res, refreshToken);

  sendSuccess(res, {
    message: "Logged in successfully",
    data: {
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const tokenVersion = decoded.sv ?? 0;
  const user = await User.findById(decoded.sub).select("+refreshTokenHash +sessionVersion");

  if (!user || !Number.isInteger(tokenVersion) || tokenVersion < 0 || (user.sessionVersion ?? 0) !== tokenVersion || user.refreshTokenHash !== hashToken(token)) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const versionFilter = tokenVersion === 0
    ? { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] }
    : { sessionVersion: tokenVersion };
  const rotatedUser = await User.findOneAndUpdate(
    { _id: user._id, refreshTokenHash: hashToken(token), ...versionFilter },
    { $set: { refreshTokenHash: hashToken(refreshToken) } },
    { returnDocument: "after" }
  );
  if (!rotatedUser) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized("Invalid refresh token");
  }

  setRefreshCookie(res, refreshToken);

  sendSuccess(res, { message: "Token refreshed", data: { accessToken } });
});

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const tokenVersion = decoded.sv ?? 0;
      if (Number.isInteger(tokenVersion) && tokenVersion >= 0) {
        const versionFilter = tokenVersion === 0
          ? { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] }
          : { sessionVersion: tokenVersion };
        await User.findOneAndUpdate(
          { _id: decoded.sub, ...versionFilter },
          { $set: { refreshTokenHash: null }, $inc: { sessionVersion: 1 } },
          { returnDocument: "after" }
        );
      }
    } catch (error) {
      if (!["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) throw error;
      // token already invalid — nothing to clean up
    }
  }
  clearRefreshCookie(res);
  sendSuccess(res, { message: "Logged out successfully" });
});

export const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, {
    message: "Current user retrieved",
    data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
});
