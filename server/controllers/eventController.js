import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";
import slugify from "slugify";

// ---------------------- CREATE EVENT ----------------------
export const createEvent = async (req, res) => {
  try {
    const {
      name, date, startTime, endTime, location,
      description, username, recurrence, privacy, question,
    } = req.body;

    console.log("Create Request Body:", req.body);

    if (!startTime) {
      return res.status(400).json({ message: "Giờ bắt đầu là bắt buộc" });
    }

    if (endTime && startTime && endTime <= startTime) {
      return res.status(400).json({ message: "Giờ kết thúc phải sau giờ bắt đầu" });
    }

    if (!username) {
      return res.status(400).json({ message: "Thiếu thông tin người tạo (username)" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: `Không tìm thấy người dùng có username: ${username}` });
    }

    let recurrenceData = null;
    if (recurrence && recurrence.enabled) {
      recurrenceData = recurrence;
    }

    const baseSlug = slugify(name || "event", { lower: true, strict: true, locale: "vi" });
    const finalSlug = `${baseSlug}-${Date.now()}`;

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
      privacy: privacy || "Public",
      question: privacy === "Private" ? question : "",

      // ✅ ADDED (nothing else changed)
      status: "pending",
      approvedAt: null,
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
      eventId: newEvent._id,
      status: newEvent.status,
    });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: err.message || "Lỗi Server Internal" });
  }
};

// ---------------------- GET ALL EVENTS ----------------------
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "username role avatar");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET EVENT BY SLUG ----------------------
export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, role } = req.query;

    const event = await Event.findOne({ slug })
      .populate("createdBy", "username email avatar role")
      .populate("volunteers", "username email role avatar");

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy event" });
    }

    // ✅ ADDED: block unapproved events (admin can still view)
    if (event.status !== "approved" && role !== "admin") {
      return res.status(403).json({ message: "Sự kiện chưa được duyệt" });
    }

    const result = event.toObject();

    result.isJoined = false;
    result.isManager = false;
    result.requestStatus = null;
    result.requests = [];

    if (userId) {
      const isVolunteer = event.volunteers.some(
        v => (v._id ? v._id.toString() : v.toString()) === userId
      );
      result.isJoined = isVolunteer;

      const isCreator = event.createdBy._id.toString() === userId;
      const userInEvent = event.volunteers.find(
        v => (v._id ? v._id.toString() : v.toString()) === userId
      );

      const isRoleManager = userInEvent?.role === "manager";
      result.isManager = isCreator || isRoleManager;

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
        }).populate("user", "username email avatar role");

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
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    const isAlreadyMember = event.volunteers.some(
      v => (v._id || v).toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    const existingPendingRequest = await JoinRequest.findOne({
      event: event._id,
      user: userId,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(400).json({ message: "Bạn đã gửi yêu cầu, vui lòng chờ duyệt." });
    }

    if (event.privacy === "Public") {
      await Event.updateOne(
        { _id: event._id },
        { $addToSet: { volunteers: userId } }
      );
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

    const event = await Event.findOneAndUpdate(
      { slug },
      { $pull: { volunteers: userId } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    await JoinRequest.deleteMany({ event: event._id, user: userId });

    res.json({ message: "Đã rời khỏi sự kiện" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- REMOVE MEMBER ----------------------
export const removeMember = async (req, res) => {
  try {
    const { slug, memberId, managerId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    const isOwner = event.createdBy.toString() === managerId;
    if (!isOwner) {
      const managerInEvent = event.volunteers.find(
        v => (v._id || v).toString() === managerId
      );
      if (managerInEvent?.role !== "manager") {
        return res.status(403).json({ message: "Bạn không có quyền xóa thành viên này" });
      }
    }

    await Event.findOneAndUpdate(
      { slug },
      { $pull: { volunteers: memberId } }
    );

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
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (date) updateFields.date = date;
    if (location) updateFields.location = location;
    if (description) updateFields.description = description;

    if (privacy) {
      updateFields.privacy = privacy;
      updateFields.question = privacy === "Public" ? "" : question;
    } else if (question && event.privacy === "Private") {
      updateFields.question = question;
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { slug },
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- DELETE EVENT ----------------------
export const deleteEvent = async (req, res) => {
  try {
    const { slug, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
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
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const requests = await JoinRequest.find({
      event: event._id,
      status: "pending",
    }).populate("user", "username email avatar role");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- RESPOND TO JOIN REQUEST ----------------------
export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    const request = await JoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Yêu cầu không tồn tại" });

    if (action === "approve") {
      request.status = "approved";
      await Event.updateOne(
        { _id: request.event },
        { $addToSet: { volunteers: request.user } }
      );
    } else {
      request.status = "rejected";
    }

    await request.save();
    res.json({ message: "Đã xử lý yêu cầu", status: request.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ====================== ADMIN APPROVE / REJECT EVENT ====================== */
export const approveEvent = async (req, res) => {
  try {
    const { eventId, action } = req.params;

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Hành động không hợp lệ" });
    }

    const update = {
      status: action,
      approvedAt: action === "approved" ? new Date() : null,
    };

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: update },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

    res.json({
      message: "Cập nhật trạng thái thành công",
      status: event.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
