import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    position: { type: String, default: "" },
    company: { type: String, default: "" },
    avatar: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    message: { type: String, required: true },
    approved: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
testimonialSchema.path("translations").options.select = false;
testimonialSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Testimonial", testimonialSchema);
