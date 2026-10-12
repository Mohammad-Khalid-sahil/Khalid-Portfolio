import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true }, // safe, randomized object name
    storageProvider: { type: String, enum: ["local", "s3", "cloudinary"], default: "local" },
    storageKey: { type: String, default: "" },
    originalName: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    category: { type: String, enum: ["image", "document"], required: true },
    usedIn: {
      type: String,
      enum: ["profile", "project", "certification", "blog", "resume", "other"],
      default: "other",
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

mediaSchema.index({ createdAt: -1 });

export default mongoose.model("Media", mediaSchema);

