import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    siteTitle: { type: String, default: "Mohammad Khalid — Full-Stack Developer" },
    siteDescription: { type: String, default: "" },
    defaultLanguage: { type: String, default: "en" },
    supportedLanguages: [{ type: String }],
    seo: {
      siteUrl: { type: String, default: "" },
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      keywords: [{ type: String }],
      ogImage: { type: String, default: "" },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
