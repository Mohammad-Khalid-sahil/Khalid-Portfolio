import { Router } from "express";
import { chatWithPortfolioAgent, aiChatValidator, aiStatus } from "../controllers/aiController.js";
import { aiLimiter } from "../middlewares/rateLimiters.js";
import { validate } from "../middlewares/validate.js";
import { protect, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.post("/chat", aiLimiter, validate(aiChatValidator), chatWithPortfolioAgent);
router.get("/status", protect, requirePermission("ai:admin"), aiStatus);

export default router;
