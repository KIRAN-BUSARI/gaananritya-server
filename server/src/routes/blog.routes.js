import { Router } from "express";
import { createBlog, deleteBlog, getBlogs, updateBlog, getAllBlogs, getBlogById } from "../controllers/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, allowedRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/create').post(upload.single("image"), verifyJWT, allowedRoles("ADMIN"), createBlog);

router.route("/all").get(getAllBlogs);

// Route to get all blogs without filtering (legacy)
router.route("/").get(getBlogs);

router.route("/update/:id").patch(upload.single("image"), verifyJWT, allowedRoles("ADMIN"), updateBlog);

router.route("/delete/:id").delete(verifyJWT, allowedRoles("ADMIN"), deleteBlog);

router.route("/:id").get(getBlogById);

export default router;