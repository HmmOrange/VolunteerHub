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
  removeMember
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
router.get("/:slug", getEventBySlug);

export default router;