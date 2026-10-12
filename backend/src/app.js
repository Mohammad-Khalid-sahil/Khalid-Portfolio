import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { corsOptions } from "./config/cors.js";
import { isProd } from "./config/env.js";
import { apiLimiter } from "./middlewares/rateLimiters.js";
import { sanitizeInput, preventParamPollution } from "./middlewares/sanitize.js";
import apiRoutes from "./routes/index.js";
import seoRoutes from "./routes/seoRoutes.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectDatabase } from "./config/database.js";
import { getLocalStorageDirectory } from "./utils/storage.js";

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  })
);
app.set("trust proxy", 1); // needed for correct req.ip behind a reverse proxy

// CORS
app.options(/^(.*)$/, cors(corsOptions));
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Compression
app.use(compression());

// Sanitize against NoSQL injection + basic HTTP parameter pollution guard
// (custom, Express-5-safe — see middlewares/sanitize.js for why)
app.use(sanitizeInput);
app.use(preventParamPollution);

// Logging
if (!isProd) app.use(morgan("dev"));

// Rate limiting on all API routes
app.use("/api", apiLimiter);

if (process.env.VERCEL !== "1") {
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  app.use("/uploads", express.static(getLocalStorageDirectory()));
}

app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    if (req.method === "GET" && req.path === "/health") return next();
    next(error);
  }
});

app.use(["/robots.txt", "/sitemap.xml"], async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// SEO crawler endpoints
app.use("/", seoRoutes);

// API routes
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Portfolio API is running" });
});

// 404 + error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
