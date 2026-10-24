import mongoose from "mongoose";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import User from "../models/User.js";
import { assertAdminBootstrapRuntime, isAdminBootstrapEnabled, runAdminBootstrap } from "./adminBootstrap.js";

export async function seedAdmin() {
  if (!isAdminBootstrapEnabled()) throw new Error("Admin bootstrap is disabled.");
  assertAdminBootstrapRuntime();

  const [{ connectDatabase }, { getSeedAdminCredentials }] = await Promise.all([
    import("../config/database.js"),
    import("../config/env.js"),
  ]);

  return runAdminBootstrap({
    connectDatabase,
    mongoose,
    User,
    getCredentials: getSeedAdminCredentials,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  seedAdmin().then(async () => {
    await mongoose.disconnect();
  }).catch(async () => {
    console.error("[seed] Admin initialization failed.");
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}
