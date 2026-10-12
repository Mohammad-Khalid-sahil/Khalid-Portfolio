import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  sendSuccess(res, { data: users.map(serializeUser) });
});

export const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  sendSuccess(res, { data: serializeUser(user) });
});

export const createUser = catchAsync(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();
  const role = req.body.role === "admin" ? "admin" : "editor";
  const avatar = req.body.avatar ?? null;

  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email, and password are required");
  }

  if (password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters long");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("A user with that email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    avatar,
  });

  sendSuccess(res, { statusCode: 201, message: "User created", data: serializeUser(user) });
});

export const updateUser = catchAsync(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) throw ApiError.notFound("User not found");

  if (req.user._id.toString() === targetUser._id.toString() && req.body.role && req.body.role !== "admin") {
    throw ApiError.forbidden("You cannot remove your own admin role");
  }

  const nextRole = req.body.role ?? targetUser.role;
  if (targetUser.role === "admin" && nextRole !== "admin") {
    const remainingAdmins = await User.countDocuments({ role: "admin", _id: { $ne: targetUser._id } });
    if (remainingAdmins === 0) {
      throw ApiError.forbidden("At least one admin account must remain");
    }
  }

  const cleanPayload = {};

  if (typeof req.body.name === "string") cleanPayload.name = req.body.name.trim();
  if (typeof req.body.email === "string") cleanPayload.email = req.body.email.trim().toLowerCase();
  if (typeof req.body.role === "string") cleanPayload.role = req.body.role === "admin" ? "admin" : "editor";
  if (typeof req.body.avatar !== "undefined") cleanPayload.avatar = req.body.avatar || null;
  if (typeof req.body.password === "string" && req.body.password.trim()) cleanPayload.password = req.body.password.trim();

  if (cleanPayload.email && cleanPayload.email !== targetUser.email) {
    const duplicate = await User.findOne({ email: cleanPayload.email, _id: { $ne: targetUser._id } });
    if (duplicate) throw ApiError.conflict("A user with that email already exists");
  }

  if (!Object.keys(cleanPayload).length) {
    throw ApiError.badRequest("No valid user fields were provided");
  }

  await User.findByIdAndUpdate(req.params.id, cleanPayload, { runValidators: true, new: true });

  const updatedUser = await User.findById(req.params.id);
  sendSuccess(res, { data: serializeUser(updatedUser) });
});

export const deleteUser = catchAsync(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) throw ApiError.notFound("User not found");

  if (req.user._id.toString() === targetUser._id.toString()) {
    throw ApiError.forbidden("You cannot delete your own account");
  }

  if (targetUser.role === "admin") {
    const remainingAdmins = await User.countDocuments({ role: "admin", _id: { $ne: targetUser._id } });
    if (remainingAdmins === 0) {
      throw ApiError.forbidden("At least one admin account must remain");
    }
  }

  await User.findByIdAndDelete(req.params.id);

  sendSuccess(res, { message: "User deleted successfully" });
});
