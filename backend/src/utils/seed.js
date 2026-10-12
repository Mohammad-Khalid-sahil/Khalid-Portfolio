import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { getSeedAdminCredentials } from "../config/env.js";
import User from "../models/User.js";

async function seedAdmin() {
  const { email, password } = getSeedAdminCredentials();
  await connectDatabase();
  const name = process.env.SEED_ADMIN_NAME || "Portfolio Admin";

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log(`[seed] Admin already exists: ${email}`);
  } else {
    await User.create({ name, email, password, role: "admin" });
    console.log(`[seed] Admin created: ${email}`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error("[seed] Failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
