import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    bio: { type: String, default: "" },
    specialization: { type: String, default: "" },
    careerGoals: { type: String, default: "" },
    interests: [{ type: String }],
    languages: [
      {
        name: { type: String, required: true },
        level: { type: String, default: "" },
      },
    ],
    location: { type: String, default: "" },
    availability: { type: Boolean, default: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    avatar: { type: String, default: null },
    resumeUrl: { type: String, default: null },
    social: {
      github: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      telegram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    socialSettings: {
      type: [{
        _id: false,
        platform: { type: String, enum: ["github", "facebook", "whatsapp", "telegram"], required: true },
        enabled: { type: Boolean, default: false },
        order: { type: Number, default: 0, min: 0, max: 99 },
      }],
      default: [],
      validate: {
        validator: (rows) => new Set(rows.map((row) => row.platform)).size === rows.length,
        message: "Social platforms must be unique",
      },
    },
    stats: [
      {
        label: { type: String, required: true },
        value: { type: Number, required: true },
        suffix: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

profileSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
profileSchema.path("translations").options.select = false;
profileSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Profile", profileSchema);
