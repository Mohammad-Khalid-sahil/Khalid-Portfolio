import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateSettingsValidator } from "../validators/settingsValidator.js";

const router = Router();

router.get("/", getSettings);
router.put("/", protect, requirePermission("settings:write"), validate(updateSettingsValidator), updateSettings);

export default router;
