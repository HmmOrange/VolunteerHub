import express from "express";
import { getUserNotifications, markAsRead, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/:userId", getUserNotifications); // Lấy thông báo
router.put("/:notificationId/read", markAsRead); // Đánh dấu đã đọc
router.put("/:userId/read-all", markAllRead); // Đánh dấu tất cả đã đọc cho user

export default router;