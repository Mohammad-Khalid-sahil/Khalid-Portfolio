import { Router } from "express";
import {
  submitContactMessage,
  getMessages,
  markMessageRead,
  deleteMessage,
} from "../controllers/contactController.js";
import { validate } from "../middlewares/validate.js";
import { contactValidator } from "../validators/contactValidator.js";
import { mongoIdParam } from "../validators/common.js";
import { contactLimiter } from "../middlewares/rateLimiters.js";
import { protect, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.post("/", contactLimiter, validate(contactValidator), submitContactMessage);
router.get("/messages", protect, requirePermission("messages:read"), getMessages);
router.patch(
  "/messages/:id/read",
  protect,
  requirePermission("messages:write"),
  validate([mongoIdParam("id")]),
  markMessageRead
);
router.delete("/messages/:id", protect, requirePermission("messages:write"), validate([mongoIdParam("id")]), deleteMessage);

export default router;
