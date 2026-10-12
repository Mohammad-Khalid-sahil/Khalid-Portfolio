import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "FiCode" },
    features: [{ type: String }],
    technologies: [{ type: String }],
    startingPrice: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
serviceSchema.path("translations").options.select = false;
serviceSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Service", serviceSchema);
