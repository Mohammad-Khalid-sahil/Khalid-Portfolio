import { Router } from "express";
import mongoose from "mongoose";

import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import userRoutes from "./userRoutes.js";
import projectRoutes from "./projectRoutes.js";
import skillRoutes from "./skillRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import experienceRoutes from "./experienceRoutes.js";
import educationRoutes from "./educationRoutes.js";
import certificationRoutes from "./certificationRoutes.js";
import testimonialRoutes from "./testimonialRoutes.js";
import blogRoutes from "./blogRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import tagRoutes from "./tagRoutes.js";
import contactRoutes from "./contactRoutes.js";
import githubRoutes from "./githubRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import aiRoutes from "./aiRoutes.js";
import cmsTranslationRoutes from "./cmsTranslationRoutes.js";
import directUploadRoutes from "./directUploadRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? "API and database are ready" : "Database is unavailable",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
router.use("/projects", projectRoutes);
router.use("/skills", skillRoutes);
router.use("/services", serviceRoutes);
router.use("/experiences", experienceRoutes);
router.use("/education", educationRoutes);
router.use("/certifications", certificationRoutes);
router.use("/testimonials", testimonialRoutes);
router.use("/blog", blogRoutes);
router.use("/categories", categoryRoutes);
router.use("/tags", tagRoutes);
router.use("/contact", contactRoutes);
router.use("/github", githubRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/media", mediaRoutes);
router.use("/uploads", directUploadRoutes);
router.use("/ai", aiRoutes);
router.use("/cms-translations", cmsTranslationRoutes);

export default router;
