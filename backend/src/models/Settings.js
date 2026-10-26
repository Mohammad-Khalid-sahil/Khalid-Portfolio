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

settingsSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
settingsSchema.path("translations").options.select = false;
settingsSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Settings", settingsSchema);
