import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    thumbnail: { type: String, default: null },
    gallery: [{ type: String }],
    description: { type: String, required: true },
    fullDescription: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: [{ type: String }],
    category: {
      type: String,
      enum: ["web", "mobile", "backend", "ai", "ui-ux", "other"],
      default: "web",
    },
    technologies: [{ type: String }],
    features: [{ type: String }],
    challenges: { type: String, default: "" },
    solutions: { type: String, default: "" },
    architecture: { type: String, default: "" },
    security: { type: String, default: "" },
    performance: { type: String, default: "" },
    results: { type: String, default: "" },
    lessonsLearned: { type: String, default: "" },
    github: { type: String, default: "" },
    demo: { type: String, default: "" },
    videoDemo: { type: String, default: "" },
    documentation: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", technologies: "text", seoKeywords: "text" });

projectSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
projectSchema.path("translations").options.select = false;
projectSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Project", projectSchema);
