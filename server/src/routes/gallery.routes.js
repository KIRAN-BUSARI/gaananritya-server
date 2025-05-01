import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteImg, getImgs, getImgsByCategory, uploadImage } from "../controllers/gallery.controller.js";
import { allowedRoles, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload").post(verifyJWT, allowedRoles("ADMIN"), upload.array('images', 10), uploadImage);

router.route("/all").get(getImgs);

router.route("/:category").get(getImgsByCategory);

router.route("/:id").delete(verifyJWT, allowedRoles("ADMIN"), deleteImg);

export default router;