import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { assertAdminBootstrapRuntime, isAdminBootstrapEnabled, runAdminBootstrap } from "./utils/adminBootstrap.js";
import mongoose from "mongoose";
import User from "./models/User.js";

async function startServer() {
  if (isAdminBootstrapEnabled()) {
    assertAdminBootstrapRuntime();
    const { getSeedAdminCredentials } = await import("./config/env.js");
    await runAdminBootstrap({
      connectDatabase,
      mongoose,
      User,
      getCredentials: getSeedAdminCredentials,
    });
  } else {
    await connectDatabase();
  }

  const server = app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Running in ${env.NODE_ENV} mode on http://${env.HOST}:${env.PORT}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`[server] Received ${signal}, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (err) => {
    // eslint-disable-next-line no-console
    console.error("[server] Unhandled rejection:", env.NODE_ENV === "production" ? "Unexpected error" : err);
    server.close(() => process.exit(1));
  });
}

startServer().catch(async (error) => {
  await mongoose.disconnect().catch(() => {});
  // eslint-disable-next-line no-console
  console.error("[server] Startup failed:", env.NODE_ENV === "production" ? "Unexpected error" : error.message);
  process.exitCode = 1;
});
