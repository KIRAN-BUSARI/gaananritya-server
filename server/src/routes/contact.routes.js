import { Router } from "express";
import { sendContactEmail, subscribeNewsletter, submitContactForm } from "../controllers/contact.controller.js";

const router = Router();

router.route("/").post(submitContactForm);
router.route("/contact").post(sendContactEmail); // New endpoint
router.route("/newsletter").post(subscribeNewsletter);

export default router;