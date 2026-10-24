export const ADMIN_BOOTSTRAP_DATABASE = "portfolio_production";

const EXPECTED_RENDER_SERVICE_ID = "srv-dbehs71srm7s73c6pkk0";
const EXPECTED_RENDER_SERVICE_NAME = "portfolio-api-production";

export function isAdminBootstrapEnabled(runtime = process.env) {
  return runtime.SEED_ADMIN_ON_START === "true";
}

export function assertAdminBootstrapRuntime(runtime = process.env) {
  if (runtime.NODE_ENV !== "production"
    || runtime.RENDER !== "true"
    || runtime.IS_PULL_REQUEST !== "false"
    || runtime.RENDER_SERVICE_ID !== EXPECTED_RENDER_SERVICE_ID
    || runtime.RENDER_SERVICE_NAME !== EXPECTED_RENDER_SERVICE_NAME) {
    throw new Error("Admin bootstrap is restricted to the verified Render Production service.");
  }
}

export async function runAdminBootstrap({
  runtime = process.env,
  connectDatabase,
  mongoose,
  User,
  getCredentials,
  logger = console,
}) {
  assertAdminBootstrapRuntime(runtime);

  if (typeof connectDatabase !== "function" || !mongoose?.connection || !User
    || typeof getCredentials !== "function") {
    throw new Error("Admin bootstrap dependencies are unavailable.");
  }

  const { email, password } = getCredentials();
  if (!email || !password) throw new Error("Admin bootstrap credentials are not configured.");

  await connectDatabase();
  if (mongoose.connection.name !== ADMIN_BOOTSTRAP_DATABASE) {
    throw new Error("Admin bootstrap database safeguard rejected the connected database.");
  }

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    logger.info("[admin-bootstrap] Existing admin preserved.");
    return "existing";
  }

  await User.create({
    name: runtime.SEED_ADMIN_NAME || "Portfolio Admin",
    email,
    password,
    role: "admin",
  });
  logger.info("[admin-bootstrap] Initial admin created.");
  return "created";
}
