import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";
import { ADMIN_BOOTSTRAP_DATABASE, assertAdminBootstrapRuntime } from "./adminBootstrap.js";

const INITIALIZATION_MARKER_ID = "production-admin-initialization-v1";
const INITIALIZATION_COLLECTION = "admin_initialization";
const SECRET_BYTES = 32;
export const ADMIN_INIT_ENV = Object.freeze({
  enabled: "PORTFOLIO_ADMIN_INIT_B4B3CFC3902B5B78_ENABLED",
  secret: "PORTFOLIO_ADMIN_INIT_B4B3CFC3902B5B78_SECRET",
  email: "PORTFOLIO_ADMIN_INIT_B4B3CFC3902B5B78_EMAIL",
  password: "PORTFOLIO_ADMIN_INIT_B4B3CFC3902B5B78_PASSWORD",
});

export function isAdminInitializationEnabled(runtime = process.env) {
  return runtime[ADMIN_INIT_ENV.enabled] === "true";
}

function isStrongInitializationSecret(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const decoded = Buffer.from(value, "base64url");
  return decoded.length === SECRET_BYTES && decoded.toString("base64url") === value;
}

function matchesInitializationSecret(supplied, expected) {
  if (!isStrongInitializationSecret(expected) || typeof supplied !== "string") return false;
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

function readCredentials(runtime) {
  const email = String(runtime[ADMIN_INIT_ENV.email] || "").trim().toLowerCase();
  const password = String(runtime[ADMIN_INIT_ENV.password] || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 20) {
    throw ApiError.serviceUnavailable("Admin initialization is unavailable.");
  }

  return { email, password };
}

function assertProductionService(runtime) {
  try {
    assertAdminBootstrapRuntime(runtime);
  } catch {
    throw ApiError.notFound("Not found");
  }
}

async function consumeInitializationSecret(collection, secret) {
  try {
    await collection.insertOne({
      _id: INITIALIZATION_MARKER_ID,
      secretHash: crypto.createHash("sha256").update(secret).digest("hex"),
      usedAt: new Date(),
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
}

export async function initializeAdminOnce({
  runtime = process.env,
  suppliedSecret,
  connectDatabase,
  mongoose,
  User,
}) {
  if (!isAdminInitializationEnabled(runtime)) throw ApiError.notFound("Not found");
  assertProductionService(runtime);

  const expectedSecret = runtime[ADMIN_INIT_ENV.secret];
  if (!matchesInitializationSecret(suppliedSecret, expectedSecret)) {
    throw ApiError.unauthorized("Invalid initialization credentials.");
  }

  const { email, password } = readCredentials(runtime);
  if (typeof connectDatabase !== "function" || !mongoose?.connection || !User) {
    throw ApiError.serviceUnavailable("Admin initialization is unavailable.");
  }

  await connectDatabase();
  const database = mongoose.connection.db;
  if (database?.databaseName !== ADMIN_BOOTSTRAP_DATABASE) {
    throw ApiError.serviceUnavailable("Admin initialization is unavailable.");
  }

  const initializationCollection = database.collection(INITIALIZATION_COLLECTION);
  const consumed = await initializationCollection.findOne({ _id: INITIALIZATION_MARKER_ID });
  if (consumed) throw ApiError.conflict("Admin initialization has already been used.");

  const existingAdminCount = await User.countDocuments({ role: "admin" });
  const existingTarget = await User.findOne({ email });
  if (existingTarget) {
    await consumeInitializationSecret(initializationCollection, expectedSecret);
    return { created: false, existingAdminFound: existingAdminCount > 0 };
  }

  let created = false;
  try {
    await User.create({ name: "Portfolio Admin", email, password, role: "admin" });
    created = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const targetAfterConflict = await User.findOne({ email });
    if (!targetAfterConflict) throw ApiError.conflict("Admin initialization could not be completed.");
  }

  await consumeInitializationSecret(initializationCollection, expectedSecret);
  return { created, existingAdminFound: existingAdminCount > 0 };
}
