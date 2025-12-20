import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { createNotificationInternal } from "../controllers/notificationController.js"; // Import Notification

// ---------------------- CREATE EVENT (CÓ THÔNG BÁO CHO ADMIN) ----------------------
export const createEvent = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ Client
    const {
      name, date, endDate, startTime, endTime, location,
      description, username, recurrence, privacy, question,
    } = req.body;

    console.log("Create Request Body:", req.body);

    // --- VALIDATION INPUT ---
    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Giờ bắt đầu và giờ kết thúc là bắt buộc" });
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const effectiveEndDate = endDate || date; // Nếu không chọn ngày kết thúc thì lấy ngày bắt đầu
    const endDateTime = new Date(`${effectiveEndDate}T${endTime}`);

    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      return res.status(400).json({ message: "Thời gian không hợp lệ" });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({ message: "Giờ kết thúc phải sau giờ bắt đầu" });
    }

    if (!username) {
        return res.status(400).json({ message: "Thiếu thông tin người tạo (username)" });
    }

    // --- TÌM NGƯỜI DÙNG ---
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: `Không tìm thấy người dùng có username: ${username}` });
    }

    // --- XỬ LÝ LẶP LẠI (RECURRENCE) ---
    let recurrenceData = null;
    if (recurrence && recurrence.enabled) {
      recurrenceData = recurrence;
    }

    // --- TẠO SLUG ---
    const baseSlug = slugify(name || "event", { lower: true, strict: true, locale: 'vi' });
    const finalSlug = `${baseSlug}-${Date.now()}`;

    // 2. Tạo đối tượng Event mới
    const newEvent = new Event({
      name,
      slug: finalSlug,
      date, 
      endDate: effectiveEndDate, 
      startTime,
      endTime,
      location,
      description,
      createdBy: user._id,
      volunteers: [user._id],
      recurrence: recurrenceData,
      privacy: privacy || "Public",
      question: privacy === "Private" ? question : "",
      status: "pending" // Mặc định là chờ duyệt
    });

    // 3. Lưu vào DB
    await newEvent.save();

    // ============================================================
    // 🔔 GỬI THÔNG BÁO CHO ADMIN (MỚI THÊM)
    // ============================================================
    try {
      // a. Tìm tất cả user là admin
      const admins = await User.find({ role: "admin" });

      if (admins.length > 0) {
        // b. Tạo thông báo cho từng admin
        const notiPromises = admins.map(admin => {
          return createNotificationInternal({
            recipientId: admin._id,
            type: "EVENT_PENDING_APPROVAL", // Loại thông báo mới
            message: `Sự kiện mới "${name}" đang chờ bạn phê duyệt.`,
            relatedId: newEvent._id,
            relatedModel: "Event"
          });
        });

        // c. Chạy song song để không làm chậm response
        await Promise.all(notiPromises);
        console.log(`Đã gửi thông báo cho ${admins.length} admin.`);
      }
    } catch (notiError) {
      // Nếu lỗi gửi thông báo thì chỉ log ra, không làm lỗi việc tạo event
      console.error("Lỗi gửi thông báo cho Admin:", notiError);
    }
    // ============================================================

    // 4. Phản hồi Client
    res.status(201).json({
      message: "Tạo Event thành công, đang chờ Admin duyệt.",
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
// Sửa lại để hỗ trợ lọc theo status cho Admin
export const getAllEvents = async (req, res) => {
  try {
    const { status } = req.query; 
    let filter = {};
    
    // Nếu có status (ví dụ admin truyền "pending") thì lọc
    if (status) {
      filter.status = status;
    }

    const events = await Event.find(filter)
      .populate("createdBy", "username role avatar")
      .sort({ createdAt: -1 });

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

    let event;

    if (mongoose.Types.ObjectId.isValid(slug)) {
      event = await Event.findById(slug)
        .populate("createdBy", "username email avatar role")
        .populate("volunteers", "username email role avatar");
    }

    if (!event) {
      event = await Event.findOne({ slug: slug })
        .populate("createdBy", "username email avatar role")
        .populate("volunteers", "username email role avatar");
    }

    if (!event)
      return res.status(404).json({ message: "Không tìm thấy event" });

    if (event.status !== "approved") {
        return res.status(403).json({ 
            message: "Sự kiện này đang chờ duyệt hoặc đã bị từ chối.",
            status: event.status // Trả về status để frontend biết mà hiển thị
        });
    }

    const result = event.toObject();

    result.isJoined = false;
    result.isManager = false;
    result.requestStatus = null;
    result.requests = [];

    if (userId) {
      const isVolunteer = event.volunteers?.some(
        (v) => (v._id ? v._id.toString() : v.toString()) === userId
      );
      result.isJoined = isVolunteer;

      const creatorId = event.createdBy._id 
        ? event.createdBy._id.toString() 
        : event.createdBy.toString();
        
      const isCreator = creatorId === userId;

      const userInEvent = event.volunteers?.find(
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
        }).populate("user", "username email avatar role");

        result.requests = pendingRequestsList;
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Get Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- JOIN EVENT ----------------------
export const joinEvent = async (req, res) => {
  try {
    const { slug, userId, answer } = req.body;

    // 1. Tìm sự kiện
    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // 2. Tìm thông tin người đang request (để lấy tên cho thông báo)
    const userSender = await User.findById(userId);
    if (!userSender) 
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    // 3. Kiểm tra xem user đã nằm trong list volunteers chưa
    // (Lưu ý: check kỹ cả trường hợp volunteer là object hoặc string ID)
    const isAlreadyMember = event.volunteers.some(
          v => (v._id || v).toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    // --- LOGIC PUBLIC (Vào thẳng không cần duyệt) ---
    if (event.privacy === "Public") {
      await Event.updateOne(
        { _id: event._id },
        { $addToSet: { volunteers: userId } }
      );
      
      // (Tuỳ chọn) Vẫn có thể thông báo cho Creator biết có người mới
      await createNotificationInternal({
        recipientId: event.createdBy,
        type: "NEW_MEMBER_JOINED",
        message: `${userSender.username} đã tham gia sự kiện "${event.name}" của bạn.`,
        relatedId: event._id,
        relatedModel: "Event"
      });

      return res.json({ message: "Tham gia thành công", status: "joined" });
    }

    // --- LOGIC PRIVATE (Cần duyệt) ---

    // Tìm request cũ của user này tại event này (bất kể status là gì)
    const existingRequest = await JoinRequest.findOne({
      event: event._id,
      user: userId,
    });

    // Biến để xác định request cuối cùng sẽ được lưu
    let finalRequest;

    if (existingRequest) {
      // A. Nếu đang chờ duyệt -> CHẶN
      if (existingRequest.status === "pending") {
         return res.status(400).json({ message: "Bạn đã gửi yêu cầu, vui lòng chờ duyệt." });
      }

      // B. Nếu status KHÁC pending (rejected, approved cũ, left...) -> TÁI SỬ DỤNG
      // Logic: Update lại thành pending để Creator duyệt lại
      existingRequest.status = "pending";
      existingRequest.answer = answer || ""; 
      existingRequest.createdAt = Date.now(); // Làm mới thời gian
      
      finalRequest = await existingRequest.save();
      
    } else {
      // C. Chưa từng có request -> TẠO MỚI
      const newRequest = new JoinRequest({
        event: event._id,
        user: userId,
        answer: answer || "",
        status: "pending",
      });
      finalRequest = await newRequest.save();
    }

    // --- GỬI THÔNG BÁO CHO CREATOR ---
    // Chỉ gửi thông báo khi request thành công (case B hoặc C)
    if (finalRequest) {
      await createNotificationInternal({
        recipientId: event.createdBy, // Người nhận là chủ event
        type: "JOIN_REQUEST",         // Loại thông báo
        message: `${userSender.username} đã gửi yêu cầu tham gia sự kiện "${event.name}".`,
        relatedId: event._id,         // Link tới sự kiện
        relatedModel: "Event"
      });
    }

    res.json({ message: "Đã gửi yêu cầu tham gia", status: "pending" });

  } catch (err) {
    console.error("Join Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LEAVE EVENT ----------------------
export const leaveEvent = async (req, res) => {
  try {
    const { slug, userId } = req.body;
    
    const event = await Event.findOneAndUpdate(
      { slug: slug },
      { $pull: { volunteers: userId } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    await JoinRequest.deleteMany({ event: event._id, user: userId });

    res.json({ message: "Đã rời khỏi sự kiện" });
  } catch (err) {
    console.error("Leave Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- REMOVE MEMBER ----------------------
export const removeMember = async (req, res) => {
  try {
    const { slug, memberId, managerId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // Kiểm tra quyền (Owner hoặc Manager)
    const isOwner = event.createdBy.toString() === managerId;
    if (!isOwner) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
        const managerInEvent = event.volunteers.find(v => (v._id || v).toString() === managerId);
        if (managerInEvent?.role !== 'manager') {
          return res.status(403).json({ message: "Bạn không có quyền xóa thành viên này" });
        }
      }
    }

    // Thực hiện xóa khỏi mảng volunteers
    await Event.findOneAndUpdate(
      { slug: slug },
      { $pull: { volunteers: memberId } }
    );
    
    // Xóa yêu cầu tham gia cũ để user có thể gửi lại yêu cầu nếu muốn
    await JoinRequest.deleteMany({ event: event._id, user: memberId });

    // --- THÔNG BÁO: Gửi đến thành viên bị xóa ---
    await createNotificationInternal({
      recipientId: memberId,
      type: "MEMBER_REMOVED",
      message: `Bạn đã bị xóa khỏi sự kiện "${event.name}".`,
      relatedId: event._id,
      relatedModel: "Event"
    });

    res.json({ message: "Đã xóa thành viên và gửi thông báo" });
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
        if (privacy === "Public") {
            updateFields.question = ""; 
        } else if (question) {
            updateFields.question = question;
        }
    } else if (question && event.privacy === 'Private') {
        updateFields.question = question;
    }

    const updatedEvent = await Event.findOneAndUpdate(
        { slug: slug },
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

    const event = await Event.findOne({ slug }).populate("volunteers");
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    // Kiểm tra quyền xóa
    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    // Danh sách ID tất cả thành viên (không bao gồm chính người xóa nếu cần lọc)
    const memberIds = event.volunteers.map(v => (v._id || v).toString());

    // --- THÔNG BÁO: Gửi cho tất cả thành viên trước khi xóa bản ghi Event ---
    if (memberIds.length > 0) {
      await Promise.all(
        memberIds.map(id => 
          createNotificationInternal({
            recipientId: id,
            type: "EVENT_DELETED",
            message: `Sự kiện "${event.name}" mà bạn tham gia đã bị hủy bỏ bởi ban tổ chức.`,
            // Lưu ý: relatedId có thể không còn truy cập được sau khi xóa Event, 
            // nhưng vẫn nên gửi để hệ thống lưu vết.
            relatedId: event._id,
            relatedModel: "Event"
          })
        )
      );
    }

    // Xóa tất cả các yêu cầu tham gia liên quan
    await JoinRequest.deleteMany({ event: event._id });
    
    // Xóa sự kiện
    await Event.findOneAndDelete({ slug });

    res.json({ message: "Xóa sự kiện thành công và đã thông báo đến tất cả thành viên!" });
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

// ---------------------- RESPOND TO JOIN REQUEST (MANAGER) ----------------------
export const respondToJoinRequest = async (req, res) => {
  try {
    const { requestId, action, managerId } = req.body;

    const request = await JoinRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Yêu cầu không tồn tại" });

    const event = await Event.findById(request.event);
    if (!event) return res.status(404).json({ message: "Sự kiện không còn tồn tại" });

    if (action === "approve") {
      request.status = "approved";

      await Event.updateOne(
          { _id: request.event },
          { $addToSet: { volunteers: request.user } }
      );
      
      // --- THÔNG BÁO: Duyệt thành viên ---
      await createNotificationInternal({
        recipientId: request.user,
        type: "VOLUNTEER_ACCEPTED",
        message: `Chúc mừng! Yêu cầu tham gia sự kiện "${event.name}" của bạn đã được chấp nhận.`,
        relatedId: event._id,
        relatedModel: "Event"
      });

    } else {
      request.status = "rejected";
      
      // --- THÔNG BÁO: Từ chối thành viên ---
      await createNotificationInternal({
        recipientId: request.user,
        type: "VOLUNTEER_REJECTED",
        message: `Yêu cầu tham gia sự kiện "${event.name}" của bạn đã bị từ chối.`,
        relatedId: event._id,
        relatedModel: "Event"
      });
    }

    await request.save(); 
    res.json({ message: "Đã xử lý yêu cầu", status: request.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================= ADMIN DUYỆT / TỪ CHỐI EVENT =======================

// 1. Duyệt sự kiện (Approve)
export const approveEvent = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID từ URL
    
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.status = "approved";
    event.approvedAt = new Date();
    await event.save();

    // Gửi thông báo cho người tạo
    await createNotificationInternal({
      recipientId: event.createdBy, 
      type: "EVENT_APPROVED",       
      message: `Xin chúc mừng! Sự kiện "${event.name}" của bạn đã được Admin phê duyệt.`,
      relatedId: event._id,         
      relatedModel: "Event"
    });

    res.status(200).json({ message: "Đã duyệt sự kiện thành công", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Từ chối sự kiện (Reject)
export const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.status = "rejected";
    await event.save();

    // Gửi thông báo cho người tạo
    await createNotificationInternal({
      recipientId: event.createdBy,
      type: "EVENT_REJECTED",
      message: `Rất tiếc, sự kiện "${event.name}" của bạn đã bị từ chối phê duyệt.`,
      relatedId: event._id,
      relatedModel: "Event"
    });

    res.status(200).json({ message: "Đã từ chối sự kiện", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};