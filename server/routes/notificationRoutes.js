import express from "express";
import { getUserNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:userId", getUserNotifications); // Lấy thông báo
router.put("/:notificationId/read", markAsRead); // Đánh dấu đã đọc

export default router;