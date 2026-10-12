import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    position: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = present
    isCurrent: { type: Boolean, default: false },
    description: { type: String, default: "" },
    responsibilities: [{ type: String }],
    achievements: [{ type: String }],
    technologies: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

experienceSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
experienceSchema.path("translations").options.select = false;
experienceSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Experience", experienceSchema);
