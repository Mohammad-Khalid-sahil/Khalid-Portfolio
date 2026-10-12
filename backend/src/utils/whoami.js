import { connectDatabase } from "../config/database.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Diagnostic tool: prints exactly which MongoDB instance/database this
 * backend is connecting to (using the same .env as `npm run dev`), and
 * lists every user currently stored there. Use this to debug "Invalid
 * email or password" — if the admin you expect isn't in this list, the
 * problem is that seeding and the running server are pointed at two
 * different databases.
 *
 * Usage: npm run whoami
 */
async function whoami() {
  console.log(`[whoami] MONGO_URI configured: ${Boolean(env.MONGO_URI)}`);

  await connectDatabase();
  console.log(`[whoami] Connected database: ${mongoose.connection.name}`);

  const users = await User.find().select("+password");
  console.log(`[whoami] Users found in this database: ${users.length}`);

  if (users.length === 0) {
    console.log(`[whoami] No users exist here at all. Run: npm run reset-admin`);
  } else {
    users.forEach((u) => {
      console.log(`[whoami]   - email: ${u.email} | role: ${u.role} | password set: ${Boolean(u.password)}`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

whoami().catch(() => {
  console.error("[whoami] Failed.");
  process.exit(1);
});
