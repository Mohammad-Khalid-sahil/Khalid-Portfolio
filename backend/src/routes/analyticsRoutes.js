import { Router } from "express";
import { trackEvent, getSummary } from "../controllers/analyticsController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { trackEventValidator } from "../validators/analyticsValidator.js";

const router = Router();

router.post("/track", validate(trackEventValidator), trackEvent);
router.get("/summary", protect, requirePermission("analytics:read"), getSummary);

export default router;
