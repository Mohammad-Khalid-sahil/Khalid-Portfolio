import express, { Router } from "express";
import { getProfile, getProfileTranslations, updateProfile } from "../controllers/profileController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateProfileValidator } from "../validators/profileValidator.js";
import { sanitizeInput } from "../middlewares/sanitize.js";

const router = Router();
const profileJsonParser = express.json({ limit: "2mb" });

router.get("/translations", protect, requirePermission("profile:write"), getProfileTranslations);
router.get("/", getProfile);
router.put("/", protect, requirePermission("profile:write"), profileJsonParser, sanitizeInput, validate(updateProfileValidator), updateProfile);

export default router;
