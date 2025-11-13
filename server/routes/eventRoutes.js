import express from "express";
import { createEvent, getAllEvents, updateEvent, deleteEvent, getEventBySlug } from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);
router.get("/:slug", getEventBySlug);

export default router;
