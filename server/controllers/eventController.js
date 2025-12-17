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

    console.log("Create Request Body:", req.body); // LOG ĐỂ DEBUG

    // 1. Validate cơ bản
    if (!startTime) {
      return res.status(400).json({ message: "Giờ bắt đầu là bắt buộc" });
    }

    // So sánh chuỗi giờ (VD: "14:00" vs "13:00")
    if (endTime && startTime) {
        if (endTime <= startTime) {
            return res.status(400).json({ message: "Giờ kết thúc phải sau giờ bắt đầu" });
        }
    }

    if (!username) {
        return res.status(400).json({ message: "Thiếu thông tin người tạo (username)" });
    }

    // 2. Tìm User
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: `Không tìm thấy người dùng có username: ${username}` });
    }

    // 3. Xử lý Recurrence
    let recurrenceData = null;
    if (recurrence && recurrence.enabled) {
      recurrenceData = recurrence;
    }

    // 4. Tạo Slug
    // Sử dụng Date.now() để đảm bảo unique
    const baseSlug = slugify(name || "event", { lower: true, strict: true, locale: 'vi' });
    const finalSlug = `${baseSlug}-${Date.now()}`;

    // 5. Tạo Event mới
    const newEvent = new Event({
      name,
      slug: finalSlug,
      date, // Đảm bảo date gửi lên đúng định dạng YYYY-MM-DD
      startTime,
      endTime,
      location,
      description,
      createdBy: user._id,
      volunteers: [user._id],
      recurrence: recurrenceData,
      privacy: privacy || "Public",
      question: privacy === "Private" ? question : "",
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
      eventId: newEvent._id,
    });
  } catch (err) {
    console.error("Create Event Error:", err);
    // Trả về lỗi chi tiết để frontend hiển thị
    res.status(500).json({ message: err.message || "Lỗi Server Internal" });
  }
};

// ---------------------- GET ALL EVENTS ----------------------
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "username role avatar");
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
      .populate("createdBy", "username email avatar")
      .populate("volunteers", "username email role avatar");

    if (!event)
      return res.status(404).json({ message: "Không tìm thấy event" });

    const result = event.toObject();

    // Default values
    result.isJoined = false;
    result.isManager = false;
    result.requestStatus = null;
    result.requests = [];

    if (userId) {
      const isVolunteer = event.volunteers.some(
        (v) => (v._id ? v._id.toString() : v.toString()) === userId
      );
      result.isJoined = isVolunteer;

      const isCreator = event.createdBy._id.toString() === userId;
      const userInEvent = event.volunteers.find(
        (v) => (v._id ? v._id.toString() : v.toString()) === userId
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
        }).populate("user", "username email avatar");

        result.requests = pendingRequestsList;
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- JOIN EVENT (SỬA) ----------------------
export const joinEvent = async (req, res) => {
  try {
    const { slug, userId, answer } = req.body;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // Check joined
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
      // SỬA: Thay vì push + save, dùng updateOne với $addToSet
      // $addToSet giúp tránh trùng lặp và không trigger validation toàn bộ doc
      await Event.updateOne(
        { _id: event._id },
        { $addToSet: { volunteers: userId } }
      );
      return res.json({ message: "Tham gia thành công", status: "joined" });
    }

    // Private logic (Lưu vào JoinRequest collection nên không ảnh hưởng validation Event)
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

// ---------------------- LEAVE EVENT (SỬA) ----------------------
export const leaveEvent = async (req, res) => {
  try {
    const { slug, userId } = req.body;
    
    // SỬA: Dùng findOneAndUpdate + $pull để bypass validation
    const event = await Event.findOneAndUpdate(
      { slug: slug },
      { $pull: { volunteers: userId } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    if (JoinRequest) {
        await JoinRequest.deleteMany({ event: event._id, user: userId });
    }

    res.json({ message: "Đã rời khỏi sự kiện" });
  } catch (err) {
    console.error("Leave Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- REMOVE MEMBER (SỬA) ----------------------
export const removeMember = async (req, res) => {
  try {
    const { slug, memberId, managerId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // Logic check quyền (giữ nguyên)
    const isOwner = event.createdBy.toString() === managerId;
    if (!isOwner) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
         const managerInEvent = event.volunteers.find(v => (v._id || v).toString() === managerId);
         if(managerInEvent?.role !== 'manager') {
             return res.status(403).json({ message: "Bạn không có quyền xóa thành viên này" });
         }
      }
    }

    // SỬA: Thay vì filter + save, dùng findOneAndUpdate + $pull
    await Event.findOneAndUpdate(
        { slug: slug },
        { $pull: { volunteers: memberId } }
    );
    
    await JoinRequest.deleteMany({ event: event._id, user: memberId });

    res.json({ message: "Đã xóa thành viên" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- UPDATE EVENT (SỬA) ----------------------
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

    // SỬA: Gom các field cần update vào object updateFields
    // Dùng findOneAndUpdate để tránh lỗi validation các field cũ không liên quan
    const updateFields = {};
    if (name) updateFields.name = name;
    if (date) updateFields.date = date;
    if (location) updateFields.location = location;
    if (description) updateFields.description = description;
    
    // Logic privacy
    if (privacy) {
        updateFields.privacy = privacy;
        if (privacy === "Public") {
            updateFields.question = ""; // Xóa câu hỏi nếu public
        } else if (question) {
            updateFields.question = question;
        }
    } else if (question && event.privacy === 'Private') {
        // Trường hợp chỉ update câu hỏi mà không gửi privacy
        updateFields.question = question;
    }

    const updatedEvent = await Event.findOneAndUpdate(
        { slug: slug },
        { $set: updateFields },
        { new: true } // Trả về data mới
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
    // findOneAndDelete an toàn, không trigger validate
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
    }).populate("user", "username email avatar");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- RESPOND TO JOIN REQUEST (SỬA) ----------------------
export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId, action, managerId } = req.body;

    const request = await JoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Yêu cầu không tồn tại" });

    const event = await Event.findById(request.event);
    if (!event) return res.status(404).json({ message: "Sự kiện không còn tồn tại" });

    if (action === "approve") {
      request.status = "approved";

      // SỬA: Dùng updateOne + $addToSet thay vì push + save
      // Logic: Chỉ thêm vào event nếu chưa tồn tại
      await Event.updateOne(
          { _id: request.event },
          { $addToSet: { volunteers: request.user } }
      );
      
    } else {
      request.status = "rejected";
    }

    await request.save(); // Save request là OK vì schema request không bị lỗi
    res.json({ message: "Đã xử lý yêu cầu", status: request.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};