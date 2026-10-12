import { Router } from "express";
import {
  getPosts,
  getAdminPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/blogController.js";
import { protect, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { mongoIdParam } from "../validators/common.js";
import { createPostValidator, updatePostValidator, listPostsValidator } from "../validators/blogValidator.js";

const router = Router();

router.get("/", validate(listPostsValidator), getPosts);
router.get("/admin/all", protect, requirePermission("content:read"), validate(listPostsValidator), getAdminPosts);
router.get("/:slug", getPostBySlug);
router.post("/", protect, requirePermission("content:write"), validate(createPostValidator), createPost);
router.put(
  "/:id",
  protect,
  requirePermission("content:write"),
  validate([mongoIdParam("id"), ...updatePostValidator]),
  updatePost
);
router.delete("/:id", protect, requirePermission("content:delete"), validate([mongoIdParam("id")]), deletePost);

export default router;
