import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise;

const SAFE_DIAGNOSTIC_TOKEN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function safeToken(value) {
  return typeof value === "string" && SAFE_DIAGNOSTIC_TOKEN.test(value) ? value : undefined;
}

function safeCode(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return safeToken(value);
}

function safeErrorMessage(error) {
  const codes = [error?.code, error?.cause?.code].map((code) => String(code || "").toUpperCase());
  const labels = [error?.codeName, error?.cause?.codeName, error?.name, error?.cause?.name]
    .map((label) => String(label || "").toLowerCase());
  const message = [error?.message, error?.cause?.message].map((value) => String(value || "").toLowerCase()).join(" ");

  if (codes.includes("18") || labels.some((label) => label.includes("authenticationfailed")) || /authentication failed|bad auth/.test(message)) {
    return "MongoDB authentication failed.";
  }
  if (codes.includes("13") || labels.some((label) => label.includes("unauthorized")) || /not authorized/.test(message)) {
    return "MongoDB authorization failed.";
  }
  if (codes.some((code) => ["ENOTFOUND", "EAI_AGAIN"].includes(code)) || /querysrv|enotfound|eai_again|dns lookup|name resolution/.test(message)) {
    return "MongoDB hostname resolution failed.";
  }
  if (codes.includes("ECONNREFUSED") || /econnrefused|connection refused/.test(message)) return "MongoDB connection was refused.";
  if (codes.includes("ETIMEDOUT") || /timed out|timeout/.test(message)) return "MongoDB connection timed out.";
  if (codes.includes("ECONNRESET") || /econnreset|connection reset/.test(message)) return "MongoDB connection was reset.";
  if (/tls|certificate/.test(message)) return "MongoDB TLS negotiation failed.";
  if (labels.some((label) => label.includes("servers election") || label.includes("serverselection"))) {
    return "MongoDB server selection failed.";
  }
  return "Database connection failed.";
}

function safeConnectionErrorSummary(error) {
  const summary = { message: safeErrorMessage(error) };
  const name = safeToken(error?.name);
  const code = safeCode(error?.code);
  const errno = typeof error?.errno === "number" && Number.isFinite(error.errno) ? error.errno : undefined;
  const codeName = safeToken(error?.codeName);
  const syscall = safeToken(error?.syscall);
  const causeName = safeToken(error?.cause?.name);
  const causeCode = safeCode(error?.cause?.code);

  if (name) summary.name = name;
  if (code !== undefined) summary.code = code;
  if (errno !== undefined) summary.errno = errno;
  if (codeName) summary.codeName = codeName;
  if (syscall) summary.syscall = syscall;
  if (causeName || causeCode !== undefined) {
    summary.cause = {};
    if (causeName) summary.cause.name = causeName;
    if (causeCode !== undefined) summary.cause.code = causeCode;
  }

  return summary;
}

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
    console.error(`[database] Connection failed. ${JSON.stringify(safeConnectionErrorSummary(error))}`);
    throw error;
  });

  return connectionPromise;
}
