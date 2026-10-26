import { Router } from "express";
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { adminContentJsonParser } from "../middlewares/adminContentJsonParser.js";
import { validate } from "../middlewares/validate.js";
import { adminResourceListValidators, mongoIdParam } from "../validators/common.js";
import { createServiceValidator, updateServiceValidator } from "../validators/serviceValidator.js";

const router = Router();

router.get("/", validate(adminResourceListValidators), getServices);
router.get("/:id", validate([mongoIdParam("id")]), getService);
router.post("/", protect, requirePermission("content:write"), ...adminContentJsonParser, validate(createServiceValidator), createService);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  ...adminContentJsonParser,
  validate([mongoIdParam("id"), ...updateServiceValidator]),
  updateService
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deleteService);

export default router;

