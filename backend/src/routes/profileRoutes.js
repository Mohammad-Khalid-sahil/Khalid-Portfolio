import { Router } from "express";
import { getProfile, getProfileTranslations, updateProfile } from "../controllers/profileController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateProfileValidator } from "../validators/profileValidator.js";

const router = Router();

router.get("/translations", protect, requirePermission("profile:write"), getProfileTranslations);
router.get("/", getProfile);
router.put("/", protect, requirePermission("profile:write"), validate(updateProfileValidator), updateProfile);

export default router;
