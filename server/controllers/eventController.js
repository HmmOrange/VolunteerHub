import Event from "../models/Event.js";
import User from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    const { name, date, location, description, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Không tìm thấy người dùng" });

    const newEvent = new Event({
      name,
      date,
      location,
      description,
      createdBy: user._id,
    });

    await newEvent.save();
    res.status(201).json({ message: "Tạo sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "username role");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId, username, name, date, location, description } = req.body;
    const user = await User.findOne({ username });
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    event.name = name;
    event.date = date;
    event.location = location;
    event.description = description;

    await event.save();
    res.json({ message: "Cập nhật sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId, username } = req.body;
    const user = await User.findOne({ username });
    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    await Event.findByIdAndDelete(eventId);
    res.json({ message: "Xóa sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === THÊM HÀM MỚI NÀY VÀO CUỐI FILE ===
export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id; // Lấy ID từ URL (vd: /api/events/12345)

    // Tìm sự kiện bằng ID và populate người tạo (giống hệt getAllEvents)
    const event = await Event.findById(eventId)
                             .populate("createdBy", "username role"); 

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Trả về dữ liệu sự kiện
    res.status(200).json(event);

  } catch (error) {
    console.error("Error fetching event by ID:", error);
    // Xử lý lỗi nếu ID không hợp lệ
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: "Invalid Event ID format" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
// =======================================