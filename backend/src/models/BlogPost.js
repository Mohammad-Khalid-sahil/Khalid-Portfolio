import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    cover: { type: String, default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: [{ type: String }],
    readingTime: { type: Number, default: 1 }, // minutes
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ title: "text", content: "text", excerpt: "text" });

blogPostSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
blogPostSchema.path("translations").options.select = false;
blogPostSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("BlogPost", blogPostSchema);
