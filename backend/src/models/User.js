import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "editor"], default: "admin" },
    avatar: { type: String, default: null },
    refreshTokenHash: { type: String, select: false, default: null },
    sessionVersion: { type: Number, default: 0, min: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  if (isBcryptHash(this.password)) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre("findOneAndUpdate", async function hashPasswordUpdate() {
  const update = this.getUpdate();
  if (!update) return;

  const password = update.password ?? update.$set?.password;
  if (!password || isBcryptHash(password)) return;

  const hashed = await bcrypt.hash(password, 12);
  if (update.password) update.password = hashed;
  if (update.$set?.password) update.$set.password = hashed;
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
