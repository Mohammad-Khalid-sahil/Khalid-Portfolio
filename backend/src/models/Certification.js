import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    organization: { type: String, required: true },
    date: { type: Date, required: true },
    credentialId: { type: String, default: "" },
    image: { type: String, default: null },
    description: { type: String, default: "" },
    verificationUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

certificationSchema.add({ translations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) } });
certificationSchema.path("translations").options.select = false;
certificationSchema.set("toJSON", { transform: (_document, value) => { delete value.translations; return value; } });

export default mongoose.model("Certification", certificationSchema);
