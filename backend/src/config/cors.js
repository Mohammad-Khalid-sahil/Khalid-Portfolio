import { env, isProd, devOrigins, normalizeOrigin } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

const configuredOrigins = isProd ? env.ALLOWED_ORIGINS : [...env.ALLOWED_ORIGINS, ...devOrigins];
const allowedOrigins = new Set([...configuredOrigins, env.CLIENT_URL].map(normalizeOrigin));

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    let normalizedOrigin;
    try {
      normalizedOrigin = normalizeOrigin(origin);
    } catch {
      callback(ApiError.forbidden("Origin is not allowed by CORS policy"));
      return;
    }

    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, normalizedOrigin);
      return;
    }

    callback(ApiError.forbidden("Origin is not allowed by CORS policy"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
