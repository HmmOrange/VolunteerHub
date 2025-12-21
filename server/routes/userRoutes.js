import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  updateAvatar,
  updateProfile,
  getProfile,
  createManager,
  importUsers,
  setBadgeVisibility,
} from "../controllers/userController.js";

import { uploadAvatar } from "../middleware/uploadAvatar.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

/* ================= IMPORT USERS ================= */

router.post(
  "/import",
  protect,
  adminOnly,
  upload.single("file"),
  importUsers
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

// PUT /api/users/profile/badge-visibility
router.put('/profile/badge-visibility', protect, setBadgeVisibility);

export default router;
