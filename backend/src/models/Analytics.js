import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    referrer: { type: String, default: "" },
    source: { type: String, default: "direct" },
    eventType: {
      type: String,
      enum: ["page_view", "project_view", "blog_view"],
      default: "page_view",
    },
    contentType: { type: String, enum: ["page", "project", "blog"], default: "page" },
    contentId: { type: String, default: "" },
    contentTitle: { type: String, default: "" },
    country: { type: String, default: "" },
    device: { type: String, enum: ["desktop", "mobile", "tablet", "unknown"], default: "unknown" },
    browser: { type: String, default: "" },
    sessionId: { type: String, default: "" },
  },
  { timestamps: true }
);

analyticsSchema.index({ path: 1, createdAt: -1 });
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1, createdAt: -1 });
analyticsSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

export default mongoose.model("Analytics", analyticsSchema);
