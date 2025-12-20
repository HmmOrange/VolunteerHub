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
  uploadEventBanner
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadBanner } from "../middleware/uploadBanner.js";

const router = express.Router();

// ... (Các route cũ giữ nguyên) ...
router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);
router.post("/join", joinEvent);
router.post("/leave", leaveEvent);
router.post("/remove-member", removeMember);
router.post("/request/respond", respondToJoinRequest);
router.get("/:eventId/requests", getPendingRequests);

// ===== ADMIN =====
// (Giữ nguyên logic debug của bạn tôi không sửa)
router.get("/admin/pending", async (req, res) => {
  req.query.role = "admin";
  req.query.status = "pending";
  return getAllEvents(req, res);
});

router.get("/admin/all", async (req, res) => {
  req.query.role = "admin";
  return getAllEvents(req, res);
});

// 2. SỬA ĐOẠN NÀY: Tách ra để gửi đúng thông báo
router.put("/admin/:id/approved", approveEvent); // Gọi hàm duyệt (gửi thông báo chúc mừng)
router.put("/admin/:id/rejected", rejectEvent);  // Gọi hàm từ chối (gửi thông báo chia buồn)

// Route cập nhật trạng thái tham gia
router.put("/:slug/attendance", updateMemberAttendance);

// Route upload banner (file upload)
router.put("/:slug/banner", protect, uploadBanner.single("banner"), uploadEventBanner);

// ⚠️ Route slug để cuối cùng
router.get("/:slug", getEventBySlug);

export default router;