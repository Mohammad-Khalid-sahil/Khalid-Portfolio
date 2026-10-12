import { Router } from "express";
import {
  getCertifications,
  getCertification,
  createCertification,
  updateCertification,
  deleteCertification,
} from "../controllers/certificationController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createCertificationValidator, updateCertificationValidator } from "../validators/certificationValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getCertifications);
router.get("/:id", validate([mongoIdParam("id")]), getCertification);
router.post(
  "/",
  protect,
  requirePermission("content:write"),
  validate(createCertificationValidator),
  createCertification
);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  validate([mongoIdParam("id"), ...updateCertificationValidator]),
  updateCertification
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteCertification);

export default router;

