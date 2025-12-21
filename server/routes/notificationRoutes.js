import express from "express";
import { getUserNotifications, markAsRead, markAllRead } from "../controllers/notificationController.js";

/**
 * Routes cho Notification
 * - Lấy danh sách thông báo, đánh dấu một thông báo là đã đọc, đánh dấu tất cả đã đọc
 */
const router = express.Router();

router.get("/:userId", getUserNotifications); // Lấy thông báo
router.put("/:notificationId/read", markAsRead); // Đánh dấu đã đọc
router.put("/:userId/read-all", markAllRead); // Đánh dấu tất cả đã đọc cho user

export default router;