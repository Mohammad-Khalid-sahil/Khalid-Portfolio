import mongoose from "mongoose";
import User from "../models/User.js";
import { connectDatabase } from "../config/database.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { initializeAdminOnce, isAdminInitializationEnabled } from "../utils/adminInitialization.js";

export const initializeAdmin = catchAsync(async (req, res) => {
  if (!isAdminInitializationEnabled()) throw ApiError.notFound("Not found");

  const authorization = req.get("authorization") || "";
  const suppliedSecret = /^Bearer ([A-Za-z0-9_-]+)$/.exec(authorization)?.[1];
  const result = await initializeAdminOnce({
    suppliedSecret,
    connectDatabase,
    mongoose,
    User,
  });

  return sendSuccess(res, {
    statusCode: result.created ? 201 : 200,
    message: "Admin initialization completed.",
    data: result,
  });
});
