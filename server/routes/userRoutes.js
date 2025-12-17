import express from "express";
import { getAllUsers, updateUserRole, toggleUserLock } from "../controllers/userController.js";
import { updateAvatar } from "../controllers/userController.js";
import { uploadAvatar } from "../middleware/uploadAvatar.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateProfile, getProfile } from "../controllers/userController.js";
const router = express.Router();

// GET /api/users/all
router.get("/all", getAllUsers);

// PUT /api/users/:userId/role
router.put("/:userId/role", updateUserRole);

router.put("/:userId/lock", toggleUserLock);

// GET /api/users/profile
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// PUT /api/users/profile/avatar
router.put(
  "/profile/avatar",
  protect,
  uploadAvatar.single("avatar"),
  updateAvatar
);

export default router;