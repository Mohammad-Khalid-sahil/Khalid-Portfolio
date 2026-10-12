import { Router } from "express";
import { completeDirectUpload, signDirectUpload } from "../controllers/directUploadController.js";
import { protect, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(protect, requirePermission("media:write"));
router.post("/sign", signDirectUpload);
router.post("/complete", completeDirectUpload);

export default router;
