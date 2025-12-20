import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  updateAvatar,
  updateProfile,
  getProfile,
  createManager, // ✅ NEW
} from "../controllers/userController.js";

import { uploadAvatar } from "../middleware/uploadAvatar.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // ✅ adminOnly REQUIRED

const router = express.Router();

/* ================= USERS ================= */

// GET /api/users/all
router.get("/all", protect, adminOnly, getAllUsers);

// PUT /api/users/:userId/role
router.put("/:userId/role", protect, adminOnly, updateUserRole);

// PUT /api/users/:userId/lock
router.put("/:userId/lock", protect, adminOnly, toggleUserLock);

/* ================= ADMIN CREATE MANAGER ================= */

// POST /api/users/admin/create-manager
router.post(
  "/admin/create-manager",
  protect,
  adminOnly,
  createManager
);

/* ================= PROFILE ================= */

// GET /api/users/profile
router.get("/profile", protect, getProfile);

// PUT /api/users/profile
router.put("/profile", protect, updateProfile);

// PUT /api/users/profile/avatar
router.put(
  "/profile/avatar",
  protect,
  uploadAvatar.single("avatar"),
  updateAvatar
);

export default router;
