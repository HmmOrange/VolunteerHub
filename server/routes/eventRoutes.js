import express from "express";
import { 
  createEvent, 
  getAllEvents, 
  updateEvent, 
  deleteEvent,
  getEventById // 1. Import hàm mới
} from "../controllers/eventController.js";

const router = express.Router();

// Các route tĩnh (phải đặt trước route động)
router.post("/create", createEvent);
router.get("/all", getAllEvents);
router.put("/update", updateEvent);
router.delete("/delete", deleteEvent);

// 2. Thêm route động /:id (phải đặt SAU route /all)
// Route này sẽ xử lý: GET /api/events/6915534281d596bed54b9740
router.get("/:id", getEventById);

export default router;