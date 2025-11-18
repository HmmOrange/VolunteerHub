import Event from "../models/Event.js";
import User from "../models/User.js";

// ---------------------- CREATE EVENT ----------------------
export const createEvent = async (req, res) => {
  try {
    const { name, date, location, description, username } = req.body;

    // Kiểm tra user có tồn tại
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Không tìm thấy người dùng" });

    // Tạo slug an toàn + chống trùng bằng timestamp
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const finalSlug = `${baseSlug}-${Date.now()}`;

    const newEvent = new Event({
      name,
      slug: finalSlug,
      date,
      location,
      description,
      createdBy: user._id,
      volunteers: [user._id],
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Lỗi hệ thống: Slug bị trùng, vui lòng thử lại." });
    }
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET ALL EVENTS ----------------------
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "username role");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET EVENT BY SLUG ----------------------
export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ slug })
      .populate("createdBy", "username")
      .populate("volunteers", "username email role");

    if (!event)
      return res.status(404).json({ message: "Không tìm thấy event" });

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- JOIN EVENT ----------------------
export const joinEvent = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    if (event.volunteers.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    event.volunteers.push(userId);
    await event.save();

    res.json({
      message: "Tham gia thành công!",
      volunteers: event.volunteers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LEAVE EVENT ----------------------
export const leaveEvent = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.volunteers = event.volunteers.filter(
      (id) => id.toString() !== userId
    );

    await event.save();

    res.json({
      message: "Đã rời khỏi sự kiện",
      volunteers: event.volunteers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- REMOVE MEMBER (KICK) ----------------------
export const removeMember = async (req, res) => {
  try {
    const { eventId, memberId, managerId } = req.body;

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const isOwner = event.createdBy.toString() === managerId;
    if (!isOwner) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa thành viên này" });
    }

    event.volunteers = event.volunteers.filter(
      (id) => id.toString() !== memberId
    );
    await event.save();

    res.json({
      message: "Đã xóa thành viên",
      volunteers: event.volunteers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- UPDATE EVENT ----------------------
export const updateEvent = async (req, res) => {
  try {
    const { slug, username, name, date, location, description } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
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

// ---------------------- DELETE EVENT ----------------------
export const deleteEvent = async (req, res) => {
  try {
    const { slug, username } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    await Event.findOneAndDelete({ slug });

    res.json({ message: "Xóa sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
