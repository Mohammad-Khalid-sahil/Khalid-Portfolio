import Settings from "../models/Settings.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";

export const getSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne().select("+translations");
  if (!settings) settings = await Settings.create({});
  const data = settings.toObject({ transform: false });
  const locale = ["fa", "ps"].includes(req.query.lang) ? req.query.lang : null;
  const localized = locale ? data.translations?.[locale] || {} : {};
  data.siteDescription = localized.siteDescription || data.siteDescription;
  if (data.seo) {
    data.seo.metaTitle = localized.metaTitle || data.seo.metaTitle;
    data.seo.metaDescription = localized.metaDescription || data.seo.metaDescription;
    data.seo.keywords = localized.keywords || data.seo.keywords;
  }
  delete data.translations;
  sendSuccess(res, { message: "Settings retrieved", data });
});

export const getSettingsTranslations = catchAsync(async (_req, res) => {
  const settings = await Settings.findOne().select("+translations");
  sendSuccess(res, { message: "Settings translations retrieved", data: { translations: settings?.translations || {} } });
});

export const updateSettings = catchAsync(async (req, res) => {
  const settings = await Settings.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  sendSuccess(res, { message: "Settings updated", data: settings });
});
