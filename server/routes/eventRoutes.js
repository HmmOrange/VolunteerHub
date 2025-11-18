import express from "express";
import { 
  createEvent, 
  getAllEvents, 
  updateEvent, 
  deleteEvent, 
  getEventBySlug,
  joinEvent,
  leaveEvent,
  removeMember
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);
router.get("/:slug", getEventBySlug);
router.post("/join", joinEvent);
router.post("/leave", leaveEvent);
router.post("/remove-member", removeMember);

export default router;