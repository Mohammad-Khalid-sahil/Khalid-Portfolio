import Settings from "../models/Settings.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

export const getSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  sendSuccess(res, { message: "Settings retrieved", data: settings });
});

export const updateSettings = catchAsync(async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  sendSuccess(res, { message: "Settings updated", data: settings });
});
