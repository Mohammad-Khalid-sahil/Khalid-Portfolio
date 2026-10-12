import { env, isProd, devOrigins } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

const productionOrigins = [...new Set(env.ALLOWED_ORIGINS.map((origin) => origin.replace(/\/+$/, "")))];
const allowedOrigins = new Set([
  ...(isProd ? productionOrigins : [...productionOrigins, ...devOrigins]),
  ...(env.CLIENT_URL ? [env.CLIENT_URL.replace(/\/+$/, "")] : []),
]);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(ApiError.forbidden("Origin is not allowed by CORS policy"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
