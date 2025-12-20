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
  
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);

router.post("/join", joinEvent);
router.post("/leave", leaveEvent);
router.post("/remove-member", removeMember);

router.post("/request/respond", respondToJoinRequest);
router.get("/:eventId/requests", getPendingRequests);

// ===== ADMIN (NEW, ADDED) =====
router.get("/admin/pending", async (req, res) => {
  req.query.role = "admin";
  req.query.status = "pending";
  return getAllEvents(req, res);
});

router.get("/admin/all", async (req, res) => {
  req.query.role = "admin";
  return getAllEvents(req, res);
});

router.put("/admin/:eventId/:action", approveEvent);

// ⚠️ MUST STAY LAST
router.get("/:slug", getEventBySlug);

export default router;
