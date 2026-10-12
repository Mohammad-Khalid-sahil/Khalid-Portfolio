import { Router } from "express";
import { listMedia, uploadMedia, deleteMedia, getMediaUsage } from "../controllers/mediaController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { upload, uploadError, verifyUploadSignature, requireMultipartStorage } from "../middlewares/upload.js";
import { mongoIdParam } from "../validators/common.js";
import { listMediaValidator } from "../validators/mediaValidator.js";

const router = Router();

router.use(protect, requirePermission("media:read"));

router.get("/", validate(listMediaValidator), listMedia);
router.post("/", requirePermission("media:write"), requireMultipartStorage, upload.single("file"), uploadError, verifyUploadSignature, uploadMedia);
router.get("/:id/usage", validate([mongoIdParam("id")]), getMediaUsage);
router.delete("/:id", requirePermission("media:delete"), validate([mongoIdParam("id")]), deleteMedia);

export default router;

