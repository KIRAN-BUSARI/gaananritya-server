import { Router } from "express";
import { addVideo, getVideos, getVideosByCategory, deleteVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getVideos);
router.get("/category/:category", getVideosByCategory);

// Protected routes - require authentication
router.post("/add", verifyJWT, addVideo);
router.delete("/:id", verifyJWT, deleteVideo);

export default router;