import Event from "../models/Event.js";
import User from "../models/User.js";

export const createEvent = async (req, res) => {
  try {
    const { name, slug, date, location, description, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Không tìm thấy người dùng" });

    const finalSlug = slug && slug.trim().length > 0
      ? slug.toLowerCase().replace(/\s+/g, "-")
      : name.toLowerCase().replace(/\s+/g, "-");

    const exists = await Event.findOne({ slug: finalSlug });
    if (exists)
      return res.status(400).json({ message: "Slug đã tồn tại" });

    const newEvent = new Event({
      name,
      slug: finalSlug,
      date,
      location,
      description,
      createdBy: user._id,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
    });
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
    const { slug, username, name, date, location, description } = req.body;
    const user = await User.findOne({ username });
    const event = await Event.findById(slug);

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
    const { slug, username } = req.body;
    const user = await User.findOne({ username });
    const event = await Event.findById(slug);

    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    await Event.findByIdAndDelete(slug);
    res.json({ message: "Xóa sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug }).populate("createdBy", "username");
    if (!event) return res.status(404).json({ message: "Không tìm thấy event" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};