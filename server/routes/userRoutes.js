import express from "express";
import { getAllUsers, updateUserRole, toggleUserLock } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getProfile } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users/all
router.get("/all", getAllUsers);

// PUT /api/users/:userId/role
router.put("/:userId/role", updateUserRole);

router.put("/:userId/lock", toggleUserLock);

// GET /api/users/profile
router.get("/profile", authMiddleware, getProfile);

export default router;