import express from "express";
import { register, login } from "../controllers/authController.js";

/**
 * Route: /api/auth
 * - Định nghĩa các endpoint liên quan tới xác thực: register, login
 */
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
