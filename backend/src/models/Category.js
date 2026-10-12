import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

categorySchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
categorySchema.path("translations").options.select = false;
categorySchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Category", categorySchema);
