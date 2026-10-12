import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise;

mongoose.connection.on("disconnected", () => {
  connectionPromise = undefined;
  // eslint-disable-next-line no-console
  console.warn("[database] Disconnected");
});

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  }).then(() => {
    // eslint-disable-next-line no-console
    if (env.NODE_ENV === "production") console.log("[database] Connected.");
    else console.log(`[database] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose;
  }).catch((error) => {
    connectionPromise = undefined;
    // eslint-disable-next-line no-console
    if (env.NODE_ENV === "production") console.error("[database] Connection failed.");
    else console.error("[database] Connection failed:", error.message);
    throw error;
  });

  return connectionPromise;
}
