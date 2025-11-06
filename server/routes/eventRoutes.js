import express from "express";
import { createEvent, getAllEvents, updateEvent, deleteEvent } from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);

export default router;
