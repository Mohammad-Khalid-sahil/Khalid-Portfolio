import Profile from "../models/Profile.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

export const getProfile = catchAsync(async (req, res) => {
  const profile = await Profile.findOne();
  sendSuccess(res, { message: "Profile retrieved", data: profile });
});

export const getProfileTranslations = catchAsync(async (_req, res) => {
  const profile = await Profile.findOne().select("+translations");
  sendSuccess(res, {
    message: "Profile translations retrieved",
    data: { translations: profile?.translations || {} },
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const profile = await Profile.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  sendSuccess(res, { message: "Profile updated", data: profile });
});
