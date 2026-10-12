import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

tagSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
tagSchema.path("translations").options.select = false;
tagSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Tag", tagSchema);
