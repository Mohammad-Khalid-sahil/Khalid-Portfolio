import { connectDatabase } from "../config/database.js";
import mongoose from "mongoose";
import { pathToFileURL } from "url";
import User from "../models/User.js";
import { getSeedAdminCredentials } from "../config/env.js";

/**
 * Forcibly sets (or creates) the admin user with the email/password from
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Use this when
 * login fails with "Invalid email or password" and you're not sure what's
 * actually stored in the database — this makes it match your .env exactly.
 *
 * Usage: npm run reset-admin
 */
export async function resetAdminPassword({ disconnect = false, logger = console.log } = {}) {
  const { email, password } = getSeedAdminCredentials();
  await connectDatabase();
  logger(`[reset-admin] Connected to database: ${mongoose.connection.name} (${mongoose.connection.host})`);

  let user = await User.findOne({ email }).select("+password");
  let created = false;

  if (user) {
    user.password = password; // triggers the pre-save hash hook
    user.role = "admin";
    await user.save();
    logger(`[reset-admin] Password reset for existing user.`);
  } else {
    user = await User.create({
      name: process.env.SEED_ADMIN_NAME || "Portfolio Admin",
      email,
      password,
      role: "admin",
    });
    created = true;
    logger(`[reset-admin] Admin user created (none existed before).`);
  }

  logger(`[reset-admin] You can now log in with:`);
  logger(`[reset-admin]   Email: ${email}`);
  logger(`[reset-admin] Password was set from SEED_ADMIN_PASSWORD.`);

  if (disconnect) await mongoose.disconnect();

  return { user, email, created };
}

const isCliRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  resetAdminPassword({ disconnect: true }).then(
    () => process.exit(0),
    (err) => {
      console.error("[reset-admin] Failed:", err);
      process.exit(1);
    }
  );
}
