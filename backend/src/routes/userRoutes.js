import { Router } from "express";
import { listUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createUserValidator, updateUserValidator, userIdParamValidator } from "../validators/userValidator.js";

const router = Router();

router.use(protect);

router.get("/", requirePermission("users:read"), listUsers);
router.post("/", requirePermission("users:write"), validate(createUserValidator), createUser);
router.get("/:id", requirePermission("users:read"), validate(userIdParamValidator), getUser);
router.patch("/:id", requirePermission("users:write"), validate([...userIdParamValidator, ...updateUserValidator]), updateUser);
router.delete("/:id", requirePermission("users:write"), validate(userIdParamValidator), deleteUser);

export default router;
