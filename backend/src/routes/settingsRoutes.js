import express, { Router } from "express";
import { getSettings, getSettingsTranslations, updateSettings } from "../controllers/settingsController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsValidator } from "../validators/settingsValidator.js";
import { sanitizeInput } from "../middlewares/sanitize.js";

const router = Router();
const settingsJsonParser = express.json({ limit: "2mb" });

router.get("/", getSettings);
router.get("/translations", protect, requirePermission("settings:write"), getSettingsTranslations);
router.put("/", protect, requirePermission("settings:write"), settingsJsonParser, sanitizeInput, validate(updateSettingsValidator), updateSettings);

export default router;
