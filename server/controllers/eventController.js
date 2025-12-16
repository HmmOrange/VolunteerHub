import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";

// ---------------------- CREATE EVENT ----------------------
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      slug,
      date,
      startTime,
      endTime,
      location,
      description,
      username,
      recurrence,
    } = req.body;

    if (!startTime) {
      return res.status(400).json({ message: "Giờ bắt đầu là bắt buộc" });
    }

    if (endTime && endTime <= startTime) {
      return res
        .status(400)
        .json({ message: "Giờ kết thúc phải sau giờ bắt đầu" });
    }

    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Không tìm thấy người dùng" });

    let recurrenceData = null;
    if (recurrence?.enabled) {
      recurrenceData = recurrence;
    }

    const finalSlug =
      slug && slug.trim()
        ? slug.toLowerCase().replace(/\s+/g, "-")
        : name.toLowerCase().replace(/\s+/g, "-");

    const exists = await Event.findOne({ slug: finalSlug });
    if (exists)
      return res.status(400).json({ message: "Slug đã tồn tại" });

    const newEvent = new Event({
      name,
      slug: finalSlug,
      date,
      startTime,
      endTime,
      location,
      description,
      createdBy: user._id,
      volunteers: [user._id],
      recurrence: recurrenceData,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
      eventId: newEvent._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET ALL EVENTS ----------------------
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "username role");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET EVENT BY SLUG ----------------------
export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;

    const event = await Event.findOne({ slug })
      .populate("createdBy", "username email")
      .populate("volunteers", "username email role");

    if (!event)
      return res.status(404).json({ message: "Không tìm thấy event" });

    const result = event.toObject();

    result.isJoined = false;
    result.isManager = false;
    result.requestStatus = null;
    result.requests = [];

    if (userId) {
      const isVolunteer = event.volunteers.some(
        (v) => v._id.toString() === userId
      );
      result.isJoined = isVolunteer;

      const isCreator = event.createdBy._id.toString() === userId;
      const userInEvent = event.volunteers.find(
        (v) => v._id.toString() === userId
      );
      result.isManager = isCreator || userInEvent?.role === "manager";

      if (isVolunteer) {
        result.requestStatus = "joined";
      } else {
        const existingRequest = await JoinRequest.findOne({
          event: event._id,
          user: userId,
        }).sort({ createdAt: -1 });

        if (existingRequest?.status === "pending") {
          result.requestStatus = "pending";
        }
      }

      if (result.isManager) {
        const pendingRequestsList = await JoinRequest.find({
          event: event._id,
          status: "pending",
        }).populate("user", "username email");

        result.requests = pendingRequestsList;
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- JOIN EVENT ----------------------
export const joinEvent = async (req, res) => {
  try {
    const { slug, userId, answer } = req.body;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    if (event.volunteers.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    const existingPendingRequest = await JoinRequest.findOne({
      event: event._id,
      user: userId,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res
        .status(400)
        .json({ message: "Bạn đã gửi yêu cầu, vui lòng chờ duyệt." });
    }

    if (event.privacy === "Public") {
      event.volunteers.push(userId);
      await event.save();
      return res.json({ message: "Tham gia thành công", status: "joined" });
    }

    const newRequest = new JoinRequest({
      event: event._id,
      user: userId,
      answer: answer || "",
      status: "pending",
    });

    await newRequest.save();
    res.json({ message: "Đã gửi yêu cầu tham gia", status: "pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LEAVE EVENT ----------------------
export const leaveEvent = async (req, res) => {
  try {
    const { slug, userId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.volunteers = event.volunteers.filter(
      (id) => id.toString() !== userId
    );

    await event.save();
    await JoinRequest.deleteMany({ event: event._id, user: userId });

    res.json({ message: "Đã rời khỏi sự kiện" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- REMOVE MEMBER (KICK) ----------------------
export const removeMember = async (req, res) => {
  try {
    const { slug, memberId, managerId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const isOwner = event.createdBy.toString() === managerId;
    if (!isOwner) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xóa thành viên này" });
      }
    }

    event.volunteers = event.volunteers.filter(
      (id) => id.toString() !== memberId
    );

    await event.save();
    await JoinRequest.deleteMany({ event: event._id, user: memberId });

    res.json({ message: "Đã xóa thành viên" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- UPDATE EVENT ----------------------
export const updateEvent = async (req, res) => {
  try {
    const { slug, username, name, date, location, description, privacy, question } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (
      user.role !== "manager" &&
      event.createdBy.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    if (name) event.name = name;
    if (date) event.date = date;
    if (location) event.location = location;
    if (description) event.description = description;
    if (privacy) event.privacy = privacy;
    if (privacy === "Public") event.question = "";
    else if (question) event.question = question;

    await event.save();
    res.json(event);
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

    if (
      user.role !== "manager" &&
      event.createdBy.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    await JoinRequest.deleteMany({ event: event._id });
    await Event.findOneAndDelete({ slug });

    res.json({ message: "Xóa sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET PENDING REQUESTS ----------------------
export const getPendingRequests = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const requests = await JoinRequest.find({
      event: event._id,
      status: "pending",
    }).populate("user", "username email");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- RESPOND TO JOIN REQUEST ----------------------
export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId, action, managerId } = req.body;

    const request = await JoinRequest.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Yêu cầu không tồn tại" });

    const event = await Event.findById(request.event);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không còn tồn tại" });

    if (action === "approve") {
      request.status = "approved";

      const isAlreadyMember = event.volunteers.some(
        (id) => id.toString() === request.user.toString()
      );

      if (!isAlreadyMember) {
        event.volunteers.push(request.user);
        await event.save();
      }
    } else {
      request.status = "rejected";
    }

    await request.save();
    res.json({ message: "Đã xử lý yêu cầu", status: request.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
