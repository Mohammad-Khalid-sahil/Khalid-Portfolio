import dotenv from "dotenv";

dotenv.config();

const DEFAULT_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];

function parseCsv(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLikelyInsecureSecret(value) {
  if (!value || typeof value !== "string") return true;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  const insecureTokens = [
    "change-me",
    "your-secret",
    "secret",
    "example",
    "placeholder",
    "development",
    "dev_change_me",
    "dev_change_me_refresh",
    "replace_with_",
    "localhost",
    "127.0.0.1",
    "mongodb://",
  ];

  return insecureTokens.some((token) => normalized.includes(token));
}

function ensureValidOriginList(label, origins) {
  const invalid = origins.filter((origin) => {
    if (!/^https?:\/\//i.test(origin)) return true;
    if (origin.includes("*")) return true;
    return false;
  });

  if (invalid.length > 0) {
    throw new Error(`[env] ${label} contains invalid origins: ${invalid.join(", ")}`);
  }
}

function required(name, fallback) {
  const configured = process.env[name];
  const value = configured !== undefined && configured !== null && String(configured).trim() !== ""
    ? configured
    : fallback;
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

export function parseJwtDurationMs(value, name = "JWT duration") {
  const match = /^(\d+)(ms|s|m|h|d|w|y)$/i.exec(String(value));
  const units = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000, y: 31_557_600_000 };
  if (!match) throw new Error(`[env] ${name} must be a positive integer followed by ms, s, m, h, d, w, or y.`);
  const duration = Number(match[1]) * units[match[2].toLowerCase()];
  if (!Number.isSafeInteger(duration) || duration < 1000) {
    throw new Error(`[env] ${name} must be at least one second and a safe duration.`);
  }
  return duration;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT == null || process.env.PORT.trim() === "" ? 5000 : Number(process.env.PORT),
  HOST: process.env.HOST || "0.0.0.0",

  MONGO_URI: required(
    "MONGO_URI",
    process.env.MONGO_URI?.trim() || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio"
  ),

  JWT_SECRET: process.env.JWT_SECRET || "dev_change_me",
  JWT_EXPIRES_IN: jwtExpiresIn,
  JWT_EXPIRES_IN_MS: parseJwtDurationMs(jwtExpiresIn, "JWT_EXPIRES_IN"),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_change_me_refresh",
  JWT_REFRESH_EXPIRES_IN: jwtRefreshExpiresIn,
  JWT_REFRESH_EXPIRES_IN_MS: parseJwtDurationMs(jwtRefreshExpiresIn, "JWT_REFRESH_EXPIRES_IN"),

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  ALLOWED_ORIGINS: parseCsv(process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173"),

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  CONTACT_RECEIVER_EMAIL: process.env.CONTACT_RECEIVER_EMAIL || "",

  GITHUB_USERNAME: process.env.GITHUB_USERNAME || "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GITHUB_CACHE_TTL_SECONDS: Number(process.env.GITHUB_CACHE_TTL_SECONDS) || 900,

  AI_API_KEY: process.env.AI_API_KEY || "",
  AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",
  AI_ENABLED: process.env.AI_ENABLED == null || process.env.AI_ENABLED.trim().toLowerCase() !== "false",
  AI_PROVIDER_ENABLED: process.env.AI_PROVIDER_ENABLED == null
    ? process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1"
    : process.env.AI_PROVIDER_ENABLED.trim().toLowerCase() === "true",
  AI_TIMEOUT_MS: Number(process.env.AI_TIMEOUT_MS) || 8000,
  AI_MAX_CONCURRENT: Number(process.env.AI_MAX_CONCURRENT) || 4,

  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
  LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR || "./uploads",
  LOCAL_STORAGE_PERSISTENT: process.env.LOCAL_STORAGE_PERSISTENT === "true",
  S3_BUCKET: process.env.S3_BUCKET || "",
  S3_REGION: process.env.S3_REGION || "",
  S3_ENDPOINT: process.env.S3_ENDPOINT || "",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",
  S3_SESSION_TOKEN: process.env.S3_SESSION_TOKEN || "",
  S3_PUBLIC_URL: process.env.S3_PUBLIC_URL || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
};

export const isProd = env.NODE_ENV === "production" || process.env.VERCEL === "1";

function assertProductionConfig() {
  if (!Number.isInteger(env.PORT) || env.PORT <= 0 || env.PORT > 65535) {
    throw new Error("[env] PORT must be a valid integer between 1 and 65535 in production.");
  }

  let mongoUrl;
  try {
    mongoUrl = new URL(env.MONGO_URI);
  } catch {
    throw new Error("[env] MONGO_URI must be a valid MongoDB connection string in production.");
  }
  const mongoHost = mongoUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["mongodb:", "mongodb+srv:"].includes(mongoUrl.protocol)
    || !mongoHost
    || mongoHost === "localhost"
    || mongoHost.endsWith(".localhost")
    || mongoHost === "::1"
    || /^127\./.test(mongoHost)) {
    throw new Error("[env] MONGO_URI must be set to a non-local production database in production.");
  }

  if (!/^https:\/\//i.test(env.CLIENT_URL)) {
    throw new Error("[env] CLIENT_URL must use HTTPS in production.");
  }

  const productionOrigins = [...new Set(env.ALLOWED_ORIGINS.map((origin) => origin.replace(/\/+$/, "")))];
  if (productionOrigins.length === 0) {
    throw new Error("[env] ALLOWED_ORIGINS must include the configured production frontend origin(s).");
  }

  ensureValidOriginList("ALLOWED_ORIGINS", productionOrigins);

  const localhostProductionOrigin = productionOrigins.some((origin) => /localhost|127\.0\.0\.1/i.test(origin));
  if (localhostProductionOrigin) {
    throw new Error("[env] Production origin configuration must not include localhost or local development URLs.");
  }

  if (!productionOrigins.includes(env.CLIENT_URL.replace(/\/+$/, ""))) {
    throw new Error("[env] CLIENT_URL must be included in ALLOWED_ORIGINS in production.");
  }

  const requiredSecrets = [
    ["JWT_SECRET", env.JWT_SECRET],
    ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
  ];

  const invalidSecrets = requiredSecrets.filter(([, value]) => {
    if (!value || typeof value !== "string") return true;
    if (value.length < 32) return true;
    if (isLikelyInsecureSecret(value)) return true;
    return false;
  });

  if (invalidSecrets.length > 0) {
    throw new Error(
      `[env] Insecure production secret configuration: ${invalidSecrets.map(([name]) => name).join(", ")}`
    );
  }

  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error(
      "[env] JWT_SECRET and JWT_REFRESH_SECRET must not be the same value in production."
    );
  }

  const hasUpstashUrl = Boolean(env.UPSTASH_REDIS_REST_URL.trim());
  const hasUpstashToken = Boolean(env.UPSTASH_REDIS_REST_TOKEN.trim());
  if (hasUpstashUrl !== hasUpstashToken) {
    throw new Error("[env] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured together.");
  }
  if (process.env.VERCEL === "1" && !hasUpstashUrl) {
    throw new Error("[env] Vercel production requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for shared rate limiting.");
  }
  if (hasUpstashUrl) {
    let redisUrl;
    try {
      redisUrl = new URL(env.UPSTASH_REDIS_REST_URL);
    } catch {
      throw new Error("[env] UPSTASH_REDIS_REST_URL must be a valid HTTPS URL.");
    }
    if (redisUrl.protocol !== "https:" || redisUrl.username || redisUrl.password || redisUrl.search || redisUrl.hash) {
      throw new Error("[env] UPSTASH_REDIS_REST_URL must be an HTTPS endpoint without credentials, query, or fragment.");
    }
  }

  if (env.AI_API_KEY) {
    if (isLikelyInsecureSecret(env.AI_API_KEY)) {
      throw new Error("[env] AI_API_KEY is using a placeholder or insecure value in production.");
    }
  }

  if (!Number.isInteger(env.AI_TIMEOUT_MS) || env.AI_TIMEOUT_MS < 1000 || env.AI_TIMEOUT_MS > 60000) {
    throw new Error("[env] AI_TIMEOUT_MS must be an integer between 1000 and 60000.");
  }
  if (!Number.isInteger(env.AI_MAX_CONCURRENT) || env.AI_MAX_CONCURRENT < 1 || env.AI_MAX_CONCURRENT > 100) {
    throw new Error("[env] AI_MAX_CONCURRENT must be an integer between 1 and 100.");
  }

  if (!["local", "s3", "cloudinary"].includes(env.STORAGE_PROVIDER)) {
    throw new Error("[env] STORAGE_PROVIDER must be local, s3, or cloudinary.");
  }

  if (env.STORAGE_PROVIDER === "local" && !env.LOCAL_STORAGE_PERSISTENT) {
    throw new Error("[env] Set LOCAL_STORAGE_PERSISTENT=true only when LOCAL_STORAGE_DIR is a persistent production volume, or use S3 storage.");
  }

  if (process.env.VERCEL === "1" && env.STORAGE_PROVIDER !== "cloudinary") {
    throw new Error("[env] Vercel deployments require STORAGE_PROVIDER=cloudinary for durable uploads.");
  }

  if (env.STORAGE_PROVIDER === "s3") {
    const requiredStorageSettings = [
      ["S3_BUCKET", env.S3_BUCKET],
      ["S3_REGION", env.S3_REGION],
      ["S3_ACCESS_KEY_ID", env.S3_ACCESS_KEY_ID],
      ["S3_SECRET_ACCESS_KEY", env.S3_SECRET_ACCESS_KEY],
      ["S3_PUBLIC_URL", env.S3_PUBLIC_URL],
    ];
    const missingStorageSettings = requiredStorageSettings.filter(([, value]) => !String(value || "").trim());
    if (missingStorageSettings.length) {
      throw new Error(`[env] Missing required S3 settings: ${missingStorageSettings.map(([name]) => name).join(", ")}`);
    }

    for (const name of ["S3_ENDPOINT", "S3_PUBLIC_URL"]) {
      const value = env[name];
      if (value && isProd && !/^https:\/\//i.test(value)) {
        throw new Error(`[env] ${name} must use HTTPS in production.`);
      }
    }
  }

  if (env.STORAGE_PROVIDER === "cloudinary") {
    const requiredCloudinarySettings = [
      ["CLOUDINARY_CLOUD_NAME", env.CLOUDINARY_CLOUD_NAME],
      ["CLOUDINARY_API_KEY", env.CLOUDINARY_API_KEY],
      ["CLOUDINARY_API_SECRET", env.CLOUDINARY_API_SECRET],
    ];
    const missingCloudinarySettings = requiredCloudinarySettings.filter(([, value]) => !String(value || "").trim());
    if (missingCloudinarySettings.length) {
      throw new Error(`[env] Missing required Cloudinary settings: ${missingCloudinarySettings.map(([name]) => name).join(", ")}`);
    }
    if (!/^[\w-]+$/.test(env.CLOUDINARY_CLOUD_NAME)) {
      throw new Error("[env] CLOUDINARY_CLOUD_NAME contains invalid characters.");
    }
  }

  const smtpConfigured = Boolean(env.SMTP_HOST || env.SMTP_USER || env.SMTP_PASS || env.CONTACT_RECEIVER_EMAIL);
  if (smtpConfigured) {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.CONTACT_RECEIVER_EMAIL) {
      throw new Error("[env] SMTP_HOST, SMTP_USER, SMTP_PASS, and CONTACT_RECEIVER_EMAIL must all be set when email is enabled in production.");
    }
  }

  if (env.GITHUB_TOKEN && isLikelyInsecureSecret(env.GITHUB_TOKEN)) {
    throw new Error("[env] GITHUB_TOKEN is using a placeholder or insecure value in production.");
  }
}

if (isProd) {
  assertProductionConfig();
}

export const devOrigins = DEFAULT_DEV_ORIGINS;

export function getSeedAdminCredentials() {
  const email = String(process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("[seed] SEED_ADMIN_EMAIL must be set to a valid email address.");
  }
  if (password.length < 12 || isLikelyInsecureSecret(password)) {
    throw new Error("[seed] SEED_ADMIN_PASSWORD must be at least 12 characters and must not be a placeholder.");
  }

  return { email, password };
}
