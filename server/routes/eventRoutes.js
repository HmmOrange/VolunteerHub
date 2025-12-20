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
  rejectEvent // <--- 1. NHỚ IMPORT CÁI NÀY
} from "../controllers/eventController.js";

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

// ⚠️ Route slug để cuối cùng
router.get("/:slug", getEventBySlug);

export default router;