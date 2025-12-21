import express from "express";
import { 
  createEvent, 
  getAllEvents, 
  updateEvent, 
  deleteEvent, 
  getEventBySlug,
  joinEvent,
  getPendingRequests,
  respondToJoinRequest,
  leaveEvent,
  removeMember,
  approveEvent,
  rejectEvent,
  updateMemberAttendance,
  uploadEventBanner,
  searchEvents,
  getUserEvents
} from "../controllers/eventController.js";
import { protect, adminOnly, optionalAuth } from "../middleware/authMiddleware.js";
import { uploadBanner } from "../middleware/uploadBanner.js";

const router = express.Router();

// ... (Các route cũ giữ nguyên) ...
router.post("/create", createEvent);
router.get("/all", optionalAuth, getAllEvents); // Sử dụng optionalAuth
router.get("/search", searchEvents); // Route search mới
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);
router.post("/join", joinEvent);
router.post("/leave", leaveEvent);
router.post("/remove-member", removeMember);
router.post("/request/respond", respondToJoinRequest);
router.get("/:eventId/requests", getPendingRequests);

// ===== ADMIN =====
// Bảo vệ với protect và adminOnly middleware
router.get("/admin/pending", protect, adminOnly, async (req, res) => {
  req.query.status = "pending"; // Chỉ cần set status
  return getAllEvents(req, res);
});

router.get("/admin/all", protect, adminOnly, getAllEvents); // Gọi trực tiếp

// 2. SỬA ĐOẠN NÀY: Tách ra để gửi đúng thông báo
router.put("/admin/:id/approved", protect, adminOnly, approveEvent); // Gọi hàm duyệt (gửi thông báo chúc mừng)
router.put("/admin/:id/rejected", protect, adminOnly, rejectEvent);  // Gọi hàm từ chối (gửi thông báo chia buồn)

// Route cập nhật trạng thái tham gia
router.put("/:slug/attendance", updateMemberAttendance);

// Route lấy các sự kiện user đã tham gia
router.get("/user/:userId", getUserEvents);

// Route upload banner (file upload)
router.put("/:slug/banner", protect, uploadBanner.single("banner"), uploadEventBanner);

// ⚠️ Route slug để cuối cùng
router.get("/:slug", getEventBySlug);

export default router;