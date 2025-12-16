import express from "express";
import { getAllUsers, updateUserRole, toggleUserLock } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users/all
router.get("/all", getAllUsers);

// PUT /api/users/:userId/role
router.put("/:userId/role", updateUserRole);

router.put("/:userId/lock", toggleUserLock);

export default router;