import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";

// ---------------------- CREATE EVENT ----------------------
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      description,
      username,
      privacy,
      question,
    } = req.body;

    // Kiểm tra user có tồn tại
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Không tìm thấy người dùng" });

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
      privacy: privacy || "Public",
      question: question || "Tại sao bạn muốn tham gia sự kiện này?",
    });

    await newEvent.save();

    res.status(201).json({
      message: "Tạo Event thành công",
      slug: newEvent.slug,
      eventId: newEvent._id,
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
    // Bạn có thể thêm filter/pagination nếu cần
    const events = await Event.find()
      .populate("createdBy", "username role")
      .select("-__v");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET EVENT BY SLUG ----------------------
// Nếu client gửi ?userId=<id> sẽ trả thêm thông tin user có đang joined/pending hay không
export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query; // Lấy userId từ query string

    // 1. Tìm Event
    const event = await Event.findOne({ slug })
      .populate("createdBy", "username email")
      .populate("volunteers", "username email role");

    if (!event) return res.status(404).json({ message: "Không tìm thấy event" });

    // Convert sang Object javascript thường để gán thêm field
    const result = event.toObject();

    // Default values
    result.isJoined = false;
    result.isManager = false;
    result.requestStatus = null; // 'pending', 'joined', 'rejected' hoặc null
    result.requests = [];

    // 2. Nếu có userId (User đã đăng nhập)
    if (userId) {
      // a. Check xem đã là thành viên chưa
      const isVolunteer = event.volunteers.some((v) => 
        v._id.toString() === userId.toString()
      );
      
      result.isJoined = isVolunteer;

      // b. Check quyền Manager
      const isCreator = event.createdBy._id.toString() === userId.toString();
      const userInEvent = event.volunteers.find(v => v._id.toString() === userId.toString());
      const isManagerRole = userInEvent?.role === 'manager';
      result.isManager = isCreator || isManagerRole;

      // c. QUAN TRỌNG: Check trạng thái Request (nếu chưa join)
      if (isVolunteer) {
        result.requestStatus = 'joined';
      } else {
        // Tìm request gần nhất của user này với event này
        const existingRequest = await JoinRequest.findOne({
          event: event._id,
          user: userId
        }).sort({ createdAt: -1 }); // Lấy cái mới nhất

        if (existingRequest) {
           // Trả về status: 'pending', 'rejected', 'approved'
           // Nếu là 'pending' thì Frontend sẽ hiện nút "Đang chờ duyệt"
           // Nếu là 'rejected' thì Frontend hiện nút "Tham gia" (để gửi lại)
           if (existingRequest.status === 'pending') {
               result.requestStatus = 'pending';
           }
        }
      }

      // d. Nếu là Manager -> Lấy danh sách requests đang chờ để duyệt
      if (result.isManager) {
        const pendingRequestsList = await JoinRequest.find({
          event: event._id,
          status: "pending"
        }).populate("user", "username email");
        
        result.requests = pendingRequestsList;
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- JOIN EVENT ----------------------
export const joinEvent = async (req, res) => {
  try {
    const { eventId, userId, answer } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // 1. Kiểm tra đã tham gia chưa
    const isAlreadyMember = event.volunteers.includes(userId);
    if (isAlreadyMember) {
      return res.status(400).json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    // 2. Kiểm tra xem có request nào ĐANG CHỜ (pending) không
    // (Bỏ qua các request đã bị rejected hoặc approved cũ)
    const existingPendingRequest = await JoinRequest.findOne({
      event: eventId,
      user: userId,
      status: "pending" 
    });

    if (existingPendingRequest) {
      return res.status(400).json({ message: "Bạn đã gửi yêu cầu, vui lòng chờ duyệt." });
    }

    // 3. Xử lý Logic Public / Private
    if (event.privacy === "Public") {
      // Public -> Vào luôn
      event.volunteers.push(userId);
      await event.save();
      return res.json({ message: "Tham gia thành công", status: "joined" });
    } else {
      // Private -> Tạo Request mới (kể cả khi trước đó đã bị reject, giờ tạo cái mới)
      const newRequest = new JoinRequest({
        event: eventId,
        user: userId,
        answer: answer || "",
        status: "pending", // Reset status về pending
      });

      await newRequest.save();
      return res.json({ message: "Đã gửi yêu cầu tham gia", status: "pending" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LEAVE EVENT ----------------------
export const leaveEvent = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.volunteers = event.volunteers.filter((id) => {
      const sid = id._id ? id._id.toString() : id.toString();
      return sid !== userId;
    });

    await event.save();

    // Optional: Xoá các join request (nếu có) của user cho event này
    await JoinRequest.deleteMany({ event: eventId, user: userId });

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
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const isOwner = event.createdBy.toString() === managerId;
    // Nếu muốn, có thể cho manager role quyền hơn: kiểm tra role của managerId
    if (!isOwner) {
      // thử kiểm tra role nếu managerId là user với role === 'manager'
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
        return res.status(403).json({ message: "Bạn không có quyền xóa thành viên này" });
      }
    }

    event.volunteers = event.volunteers.filter(
      (id) => (id._id ? id._id.toString() : id.toString()) !== memberId
    );
    await event.save();

    // Optional: Xoá request (nếu member có request pending)
    await JoinRequest.deleteMany({ event: eventId, user: memberId });

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
    const { slug, username, name, date, location, description, privacy, question } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    if (name) event.name = name;
    if (date) event.date = date; // Date từ input type="date"
    if (location) event.location = location;
    if (description) event.description = description;
    if (privacy) event.privacy = privacy;
    if (privacy === 'Public') event.question = ""; 
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
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    // Xoá mọi JoinRequest liên quan trước khi xoá event
    await JoinRequest.deleteMany({ event: event._id });

    await Event.findOneAndDelete({ slug });

    res.json({ message: "Xóa sự kiện thành công!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET PENDING REQUESTS ----------------------
// Lấy tất cả join request có status 'pending' cho 1 event (dành cho tab quản lý)
export const getPendingRequests = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Bạn có thể check quyền ở đây: chỉ owner/manager mới được gọi endpoint này
    const requests = await JoinRequest.find({ event: eventId, status: "pending" })
      .populate("user", "username email");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- RESPOND TO JOIN REQUEST ----------------------
// body: { requestId, action: 'approve'|'reject', responderId }
export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId, action, managerId } = req.body; // action: 'approve' hoặc 'reject'

    // 1. Tìm Request
    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Yêu cầu không tồn tại" });
    }

    // 2. Kiểm tra Event tồn tại
    const event = await Event.findById(request.event);
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không còn tồn tại" });
    }

    // 3. Xử lý Action
    if (action === "approve") {
      request.status = "approved"; // Cập nhật status
      
      // Thêm user vào event (check trùng trước cho chắc)
      const isAlreadyMember = event.volunteers.some(id => id.toString() === request.user.toString());
      if (!isAlreadyMember) {
        event.volunteers.push(request.user);
        await event.save(); // Lưu Event
      }
    } else {
      request.status = "rejected"; // Cập nhật status thành rejected
    }

    // 4. QUAN TRỌNG: Lưu thay đổi vào bảng JoinRequest
    await request.save(); 

    res.json({ message: "Đã xử lý yêu cầu", status: request.status });
  } catch (err) {
    console.error("Lỗi duyệt yêu cầu:", err);
    res.status(500).json({ message: err.message });
  }
};