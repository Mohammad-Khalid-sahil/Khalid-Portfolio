import { Router } from "express";
import { getRobots, getSitemap } from "../controllers/seoController.js";

const router = Router();

router.get("/robots.txt", getRobots);
router.get("/sitemap.xml", getSitemap);

export default router;
