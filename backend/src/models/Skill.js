import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["frontend", "backend", "database", "mobile", "devops", "tools", "other"],
      required: true,
    },
    icon: { type: String, default: null },
    level: { type: Number, min: 0, max: 100, default: 50 },
    yearsExperience: { type: Number, default: 1 },
    description: { type: String, default: "" },
    relatedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

skillSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
skillSchema.path("translations").options.select = false;
skillSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Skill", skillSchema);
