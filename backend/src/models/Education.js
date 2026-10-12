import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    university: { type: String, required: true },
    faculty: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    gpa: { type: String, default: "" },
    courses: [{ type: String }],
    thesis: { type: String, default: "" },
    description: { type: String, default: "" },
    achievements: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

educationSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
educationSchema.path("translations").options.select = false;
educationSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Education", educationSchema);
