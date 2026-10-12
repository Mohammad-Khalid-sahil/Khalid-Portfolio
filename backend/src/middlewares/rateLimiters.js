import rateLimit from "express-rate-limit";
import { env, isProd } from "../config/env.js";
import { UpstashRateLimitStore } from "../utils/UpstashRateLimitStore.js";

function createLimiter(namespace, options) {
  const useSharedStore = isProd && Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  return rateLimit({
    ...options,
    ...(useSharedStore ? { store: new UpstashRateLimitStore(namespace) } : {}),
  });
}

export const apiLimiter = createLimiter("api", {
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

export const authLimiter = createLimiter("auth", {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later." },
});

export const contactLimiter = createLimiter("contact", {
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many messages sent. Please try again in an hour." },
});

export const aiLimiter = createLimiter("ai", {
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests, please try again in a few minutes." },
});
