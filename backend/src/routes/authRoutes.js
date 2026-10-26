import { Router } from "express";
import { login, refresh, logout, getMe } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { loginValidator } from "../validators/authValidator.js";
import { authLimiter } from "../middlewares/rateLimiters.js";
import { protect } from "../middlewares/auth.js";
import { initializeAdmin } from "../controllers/adminInitializationController.js";

const router = Router();

router.post("/login", authLimiter, validate(loginValidator), login);
router.post("/initialize-admin", authLimiter, initializeAdmin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;
