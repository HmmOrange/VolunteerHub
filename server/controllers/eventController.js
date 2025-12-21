import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";
import Post from "../models/Post.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { createNotificationInternal } from "../controllers/notificationController.js"; // Import Notification

/**
 * Helper: Tạo bài đăng tự động cho một Event mới (createEventPost)
 * - Input: đối tượng `event` (Event document).
 * - Hành động: kiểm tra nếu đã tồn tại announcement cho event, nếu chưa thì tạo một Post công khai mô tả event.
 * - Output: trả về Post vừa tạo hoặc Post đã tồn tại; lỗi được catch và log (không throw tiếp).
 */
const createEventPost = async (event) => {
  try {
    // Kiểm tra xem đã có bài announcement cho event này chưa
    const existingAnnouncement = await Post.findOne({
      eventId: event._id,
      isEventAnnouncement: true
    });
    
    if (existingAnnouncement) {
      console.log(`Bài announcement cho sự kiện ${event.name} đã tồn tại, bỏ qua tạo mới.`);
      return existingAnnouncement;
    }
    
    // Tạo nội dung bài đăng từ thông tin sự kiện
    const startDate = new Date(event.date);
    const endDate = new Date(event.endDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    const formatTime = (time) => {
      return time || '';
    };
    
    let content = `🎉 Sự kiện mới: ${event.name}\n\n`;
    
    if (event.description) {
      content += `📝 Mô tả: ${event.description}\n\n`;
    }
    
    content += `📅 Thời gian bắt đầu: ${formatDate(startDate)} lúc ${formatTime(event.startTime)}\n`;
    content += `📅 Thời gian kết thúc: ${formatDate(endDate)} lúc ${formatTime(event.endTime)}\n\n`;
    
    if (event.location) {
      content += `📍 Địa điểm: ${event.location}\n\n`;
    }
    
    content += `Hãy tham gia cùng chúng tôi! 💪`;
    
    // Tạo bài đăng công khai
    const newPost = new Post({
      content,
      imageUrl: event.banner || null,
      isAnonymous: false,
      isEventAnnouncement: true, // Đánh dấu là bài đăng tự động
      eventId: event._id,
      createdBy: event.createdBy,
      likes: []
    });
    
    await newPost.save();
    console.log(`Đã tạo bài đăng tự động cho sự kiện: ${event.name}`);
    
    return newPost;
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng tự động:", error);
    // Không throw error để không làm gián đoạn việc tạo event
  }
};

/**
 * Tạo một Event mới (createEvent)
 * - Input: `req.body` chứa thông tin event như `name`, `date`, `startTime`, `endTime`, `username`, `privacy`, v.v.
 * - Hành động: validate thời gian, tìm user tạo, tạo Event trong DB, tự động tạo bài announcement và gửi notification tới admin để duyệt.
 * - Output: trả về `201` với slug và eventId; hoặc lỗi tương ứng.
 */
export const createEvent = async (req, res) => {
  try {
    const {
      name, date, endDate, startTime, endTime, location,
      description, username, recurrence, privacy, question, banner,
    } = req.body;

    console.log("Create Request Body:", req.body);

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

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: `Không tìm thấy người dùng có username: ${username}` });
    }

    let recurrenceData = null;
    if (recurrence && recurrence.enabled) {
      recurrenceData = recurrence;
    }

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
      banner: null, // Banner sẽ được upload riêng sau khi tạo event
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
    // 🎉 TỰ ĐỘNG TẠO BÀI ĐĂNG CÔNG KHAI CHO SỰ KIỆN (MỚI THÊM)
    // ============================================================
    try {
      await createEventPost(newEvent);
    } catch (postError) {
      console.error("Lỗi tạo bài đăng cho sự kiện:", postError);
      // Không làm gián đoạn việc tạo event
    }

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
    
    // Kiểm tra user role từ req.user (được set bởi protect middleware)
    const isAdmin = req.user && req.user.role === "admin";
    
    // Nếu có status (ví dụ admin truyền "pending") thì lọc
    if (status) {
      filter.status = status;
    } else if (!isAdmin) {
      // Nếu không phải admin và không chỉ định status, chỉ lấy approved
      filter.status = "approved";
    }
    // Nếu là admin và không có status, lấy tất cả

    const events = await Event.find(filter)
      .populate("createdBy", "username role avatar")
      .sort({ createdAt: -1 });

    console.log(`getAllEvents - isAdmin: ${isAdmin}, filter:`, filter, `- found ${events.length} events`);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thông tin Event theo `slug` hoặc id (getEventBySlug)
 * - Input: `req.params.slug`, optional `req.query.userId` để xác định trạng thái người dùng với event.
 * - Hành động: tìm Event, kiểm tra quyền/ trạng thái, tính toán isJoined/isManager/requestStatus và gắn attendance cho từng volunteer.
 * - Output: trả về object event chi tiết hoặc lỗi 404/403/500.
 */
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

    // Lấy thông tin attendance từ Event model
    const attendanceMap = {};
    if (event.attendance && Array.isArray(event.attendance)) {
      event.attendance.forEach(att => {
        attendanceMap[att.user.toString()] = att.status || 'pending';
      });
    }

    // Thêm attendance vào từng volunteer
    if (result.volunteers && Array.isArray(result.volunteers)) {
      result.volunteers = result.volunteers.map(vol => {
        const volId = vol._id.toString();
        return {
          ...vol,
          attendance: attendanceMap[volId] || 'pending'
        };
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Get Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Xử lý yêu cầu tham gia Event (joinEvent)
 * - Input: `req.body` gồm `slug`, `userId`, optional `answer` cho private event.
 * - Hành động: tìm Event và user, xử lý theo privacy (Public: join ngay, Private: tạo hoặc cập nhật JoinRequest), gửi notification tới creator.
 * - Output: trả về trạng thái tham gia hoặc pending; hoặc lỗi tương ứng.
 */
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

/**
 * Cập nhật Event (updateEvent)
 * - Input: `req.body` chứa `slug`, `username` và các trường cần cập nhật hoặc `action` đặc biệt (cancel, end_early, extend).
 * - Hành động: kiểm tra quyền (creator/manager), áp dụng các cập nhật hoặc action, xử lý trao badge khi event completed, gửi thông báo nếu cần.
 * - Output: trả về `updatedEvent` hoặc lỗi.
 */
export const updateEvent = async (req, res) => {
  try {
    const { slug, username, name, date, endDate, startTime, endTime, location, description, privacy, question, banner, action, extendHours } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    const updateFields = {};
    
    // Xử lý các actions đặc biệt
    if (action) {
      const now = new Date();
      
      switch(action) {
        case 'cancel':
          // Hủy sự kiện
          updateFields.eventStatus = 'cancelled';
          break;
          
        case 'end_early':
          // Kết thúc sớm - cập nhật endDate và endTime về hiện tại
          updateFields.eventStatus = 'completed';
          updateFields.endDate = now;
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          updateFields.endTime = `${hours}:${minutes}`;
          break;
          
        case 'extend':
          // Extend thời gian - chỉ cho phép khi đang diễn ra
          if (!extendHours || extendHours <= 0) {
            return res.status(400).json({ message: "Số giờ extend phải lớn hơn 0" });
          }
          
          const currentEndDate = new Date(event.endDate || event.date);
          if (event.endTime) {
            const [h, m] = event.endTime.split(':');
            currentEndDate.setHours(parseInt(h), parseInt(m), 0, 0);
          }
          
          // Thêm số giờ
          currentEndDate.setHours(currentEndDate.getHours() + parseInt(extendHours));
          
          updateFields.endDate = currentEndDate;
          const newHours = String(currentEndDate.getHours()).padStart(2, '0');
          const newMinutes = String(currentEndDate.getMinutes()).padStart(2, '0');
          updateFields.endTime = `${newHours}:${newMinutes}`;
          break;
          
        default:
          return res.status(400).json({ message: "Action không hợp lệ" });
      }
    }
    
    // Các trường thông thường
    if (name) updateFields.name = name;
    if (date) updateFields.date = date;
    if (endDate) updateFields.endDate = endDate;
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (location) updateFields.location = location;
    if (description) updateFields.description = description;
    if (banner !== undefined) updateFields.banner = banner || null;
    
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

    // Nếu sự kiện được chuyển sang trạng thái 'completed', tự động trao badge cho chủ sự kiện
    try {
      const becameCompleted = (updateFields.eventStatus && updateFields.eventStatus === 'completed') || (updatedEvent.eventStatus === 'completed');
      if (becameCompleted) {
        const owner = await User.findById(updatedEvent.createdBy);
        if (owner) {
          owner.badges = owner.badges || [];
          const existing = owner.badges.find(b => b.eventId && b.eventId.toString() === updatedEvent._id.toString());
          const eventBadge = updatedEvent.badge || null;
          if (!existing) {
            owner.badges.push({
              eventId: updatedEvent._id,
              eventName: updatedEvent.name,
              level: 1,
              image: eventBadge,
              visible: true,
              eventEndDate: updatedEvent.endDate || updatedEvent.date
            });
          } else {
            existing.image = eventBadge;
            existing.eventName = updatedEvent.name;
            existing.eventEndDate = updatedEvent.endDate || updatedEvent.date;
            existing.level = existing.level || 1;
          }
          await owner.save();

          // Tạo thông báo cho owner
          try {
            await createNotificationInternal({
              recipientId: owner._id,
              type: 'AWARDED_BADGE',
              message: `Bạn đã nhận được Badge cho sự kiện "${updatedEvent.name}".`,
              relatedId: updatedEvent._id,
              relatedModel: 'Event'
            });
          } catch (e) {
            console.warn('Failed to notify owner about badge award:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error awarding badge to event owner on completion:', e);
    }

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Xóa Event (deleteEvent)
 * - Input: `req.body` chứa `slug` và `username` của người thao tác.
 * - Hành động: kiểm tra quyền, gửi thông báo tới tất cả thành viên, xóa JoinRequest liên quan và xóa Event.
 * - Output: trả về message xác nhận hoặc lỗi.
 */
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
// ---------------------- BATCH REMOVE MEMBERS ----------------------
export const batchRemoveMembers = async (req, res) => {
  try {
    const { slug, memberIds, username } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const event = await Event.findOne({ slug }).populate("volunteers.user", "username email role avatar");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    // Kiểm tra quyền (phải là manager hoặc creator)
    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

    // Loại bỏ các thành viên
    event.volunteers = event.volunteers.filter(v => !memberIds.includes(v.user._id.toString()));
    await event.save();

    const updatedEvent = await Event.findOne({ slug })
      .populate("createdBy", "username email avatar role")
      .populate("volunteers.user", "username email role avatar");

    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- BATCH GRANT MANAGER ROLE ----------------------
export const batchGrantManager = async (req, res) => {
  try {
    const { slug, memberIds, username } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const event = await Event.findOne({ slug }).populate("volunteers.user", "username email role avatar");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    // Kiểm tra quyền (phải là manager hoặc creator)
    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

    // Cập nhật role
    event.volunteers.forEach(v => {
      if (memberIds.includes(v.user._id.toString())) {
        v.role = "manager";
      }
    });

    await event.save();

    const updatedEvent = await Event.findOne({ slug })
      .populate("createdBy", "username email avatar role")
      .populate("volunteers.user", "username email role avatar");

    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- BATCH MARK ATTENDANCE ----------------------
export const batchMarkAttendance = async (req, res) => {
  try {
    const { slug, memberIds, attended, username } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
    }

    if (!["yes", "no"].includes(attended)) {
      return res.status(400).json({ message: "Trạng thái tham gia không hợp lệ" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const event = await Event.findOne({ slug }).populate("volunteers.user", "username email role avatar");
    if (!event) {
      return res.status(404).json({ message: "Sự kiện không tồn tại" });
    }

    // Kiểm tra quyền (phải là manager hoặc creator)
    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

    // Cập nhật trạng thái tham gia
    event.volunteers.forEach(v => {
      if (memberIds.includes(v.user._id.toString())) {
        v.attended = attended;
      }
    });

    await event.save();

    const updatedEvent = await Event.findOne({ slug })
      .populate("createdBy", "username email avatar role")
      .populate("volunteers.user", "username email role avatar");

    res.status(200).json(updatedEvent);
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

/**
 * Cập nhật trạng thái tham gia của thành viên trong Event (updateMemberAttendance)
 * - Input: `req.params.slug`, `req.body` chứa `userId` và `attendance` (completed|absent|pending).
 * - Hành động: kiểm tra quyền requester (creator/manager), cập nhật event.attendance, gắn hoặc loại bỏ badge tương ứng và thông báo người dùng.
 * - Output: trả về message và trạng thái attendance hoặc lỗi.
 */
export const updateMemberAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, attendance } = req.body; // attendance: 'completed' hoặc 'absent'
    const requesterId = req.user?.id || req.body.requesterId;

    // Kiểm tra input
    if (!userId || !attendance) {
      return res.status(400).json({ message: "Thiếu userId hoặc attendance" });
    }

    if (!['completed', 'absent', 'pending'].includes(attendance)) {
      return res.status(400).json({ message: "Trạng thái attendance không hợp lệ" });
    }

    // Tìm event
    const event = await Event.findOne({ slug })
      .populate("createdBy", "_id username")
      .populate("volunteers", "_id username role");

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

    // Kiểm tra quyền: chỉ creator hoặc manager được phép
    const isCreator = event.createdBy._id.toString() === requesterId;
    const requesterInEvent = event.volunteers?.find(
      v => v._id.toString() === requesterId
    );
    const isManager = requesterInEvent?.role === 'manager';

    if (!isCreator && !isManager) {
      return res.status(403).json({ 
        message: "Chỉ người tổ chức hoặc quản lý mới có quyền cập nhật trạng thái tham gia" 
      });
    }

    // Kiểm tra user có trong volunteers không
    const userInVolunteers = event.volunteers?.some(
      v => v._id.toString() === userId
    );

    if (!userInVolunteers) {
      return res.status(404).json({ 
        message: "Người dùng này không phải là thành viên của sự kiện" 
      });
    }

    // Khởi tạo attendance array nếu chưa có
    if (!event.attendance) {
      event.attendance = [];
    }

    // Tìm hoặc tạo attendance record cho user
    const existingAttendance = event.attendance.find(
      a => a.user.toString() === userId
    );

    if (existingAttendance) {
      existingAttendance.status = attendance;
    } else {
      event.attendance.push({
        user: userId,
        status: attendance
      });
    }

    await event.save();

    // If marked completed, award badge and notify user; if marked absent, remove badge
    try {
      if (attendance === 'completed') {
        const user = await User.findById(userId);
        if (user) {
          user.badges = user.badges || [];
          const existing = user.badges.find(b => b.eventId && b.eventId.toString() === event._id.toString());
          const eventBadge = event.badge || null;
          if (!existing) {
            user.badges.push({ eventId: event._id, eventName: event.name, level: 1, image: eventBadge, visible: true, eventEndDate: event.endDate || event.date });
          } else {
            existing.image = eventBadge;
            existing.eventName = event.name;
            existing.eventEndDate = event.endDate || event.date;
            existing.level = existing.level || 1;
          }
          await user.save();

          // Send notification
          try {
            await createNotificationInternal({
              recipientId: user._id,
              type: 'AWARDED_BADGE',
              message: `Bạn đã được ghi nhận hoàn thành sự kiện "${event.name}" và được trao Badge.`,
              relatedId: event._id,
              relatedModel: 'Event'
            });
          } catch (e) {
            console.warn('Notification error:', e);
          }
        }
      } else if (attendance === 'absent') {
        // remove badge if exists
        const user = await User.findById(userId);
        if (user) {
          user.badges = (user.badges || []).filter(b => !(b.eventId && b.eventId.toString() === event._id.toString()));
          await user.save();
        }
      }
    } catch (e) {
      console.error('Error updating badge after attendance change:', e);
    }

    res.status(200).json({ 
      message: "Cập nhật trạng thái tham gia thành công",
      attendance: attendance
    });

  } catch (err) {
    console.error("Update Attendance Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===================== SEARCH EVENTS =====================
export const searchEvents = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Tìm tất cả events đã được approved với đầy đủ thông tin
    const events = await Event.find({ status: "approved" })
      .populate("createdBy", "username role avatar")
      .select("name slug date endDate startTime endTime location description banner createdAt status volunteers")
      .lean();

    // Thêm số lượng volunteers vào mỗi event
    const eventsWithCount = events.map(event => ({
      ...event,
      volunteersCount: event.volunteers ? event.volunteers.length : 0
    }));

    console.log(`searchEvents - query: "${query}" - found ${eventsWithCount.length} approved events`);
    res.json(eventsWithCount);
  } catch (err) {
    console.error("Search Events Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Upload và cập nhật banner cho Event (uploadEventBanner)
 * - Input: `req.params.slug`, file upload từ `req.file` (multer).
 * - Hành động: kiểm tra quyền (creator/manager), xóa file cũ nếu có, lưu path mới, cập nhật bài announcement nếu tồn tại.
 * - Output: trả về message và path banner, hoặc lỗi.
 */
export const uploadEventBanner = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

    // Kiểm tra quyền (chỉ creator hoặc manager)
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "manager" || req.user.role === "admin";

    if (!isCreator && !isManager) {
      return res.status(403).json({ 
        message: "Bạn không có quyền cập nhật banner cho sự kiện này" 
      });
    }

    // Lấy path của file đã upload (từ multer middleware)
    if (!req.file) {
      return res.status(400).json({ message: "Không có file banner được upload" });
    }

    // Xóa banner cũ nếu có
    if (event.banner) {
      const fs = await import("fs");
      const oldPath = event.banner.startsWith("/") ? `.${event.banner}` : event.banner;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Lưu path mới
    const bannerPath = `/uploads/banners/${req.file.filename}`;
    event.banner = bannerPath;
    await event.save();

    // ============================================================
    // 🎉 CẬP NHẬT BÀI ĐĂNG TỰ ĐỘNG VỚI BANNER MỚI
    // ============================================================
    try {
      // Tìm bài đăng tự động (announcement) của sự kiện
      const eventPost = await Post.findOne({
        eventId: event._id,
        isEventAnnouncement: true
      });

      if (eventPost) {
        eventPost.imageUrl = bannerPath;
        await eventPost.save();
        console.log(`Đã cập nhật banner cho bài đăng announcement của sự kiện: ${event.name}`);
      }
    } catch (postUpdateError) {
      console.error("Lỗi cập nhật bài đăng với banner:", postUpdateError);
      // Không làm gián đoạn việc upload banner
    }

    res.json({
      message: "Cập nhật banner thành công",
      banner: event.banner,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Upload và cập nhật badge cho Event (uploadEventBadge)
 * - Input: `req.params.slug`, file upload từ `req.file`.
 * - Hành động: kiểm tra quyền, xóa badge cũ nếu có, lưu path badge và cập nhật Event.
 * - Output: trả về message và path badge hoặc lỗi.
 */
export const uploadEventBadge = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });

    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    // Kiểm tra quyền
    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "manager" || req.user.role === "admin";
    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật badge cho sự kiện này" });
    }

    if (!req.file) return res.status(400).json({ message: "Không có file badge được upload" });

    // Xóa badge cũ nếu có
    if (event.badge) {
      const fs = await import("fs");
      const oldPath = event.badge.startsWith("/") ? `.${event.badge}` : event.badge;
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e){ console.warn('Không xóa được file cũ', e); }
      }
    }

    const badgePath = `/uploads/badges/${req.file.filename}`;
    event.badge = badgePath;
    await event.save();

    res.json({ message: "Cập nhật badge thành công", badge: event.badge });
  } catch (err) {
    console.error("Upload Event Badge Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lưu trạng thái đóng góp của các thành viên cho Event (saveContributions)
 * - Input: `req.params.slug`, `req.body.contributions` là object mapping userId -> boolean.
 * - Hành động: kiểm tra quyền (chỉ creator), cập nhật event.contributions, gắn/loại bỏ badge cho từng user và gửi thông báo nếu cần.
 * - Output: trả về event đã cập nhật hoặc lỗi.
 */
export const saveContributions = async (req, res) => {
  try {
    const { slug } = req.params;
    const { contributions } = req.body; // expected object: { userId: value }

    if (!contributions || typeof contributions !== 'object') {
      return res.status(400).json({ message: 'Contributions invalid' });
    }

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: 'Sự kiện không tồn tại' });

    // Kiểm tra quyền: chỉ creator
    const requesterId = req.user._id.toString();
    const isCreator = event.createdBy.toString() === requesterId;
    if (!isCreator) return res.status(403).json({ message: 'Bạn không có quyền cập nhật đóng góp' });

    // Update event.contributions array (completed boolean)
    event.contributions = event.contributions || [];
    for (const [userId, value] of Object.entries(contributions)) {
      const completed = !!value;
      const idx = event.contributions.findIndex(c => (c.user.toString ? c.user.toString() : c.user) === userId);
      if (idx !== -1) {
        event.contributions[idx].completed = completed;
      } else {
        event.contributions.push({ user: userId, completed: completed });
      }
    }

    await event.save();

    // Gắn/loại bỏ badge cho từng user dựa trên completed === true
    const eventBadge = event.badge || null;
    const updates = [];
    for (const c of event.contributions) {
      const uid = c.user.toString ? c.user.toString() : c.user;
      const completed = !!c.completed;
      const user = await User.findById(uid);
      if (!user) continue;

      user.badges = user.badges || [];
      const existing = user.badges.find(b => b.eventId && b.eventId.toString() === event._id.toString());

      if (completed) {
        // Add or update badge (keep existing.visible if present)
        if (existing) {
          existing.level = existing.level || 1;
          existing.image = eventBadge;
          existing.eventName = event.name;
          existing.eventEndDate = event.endDate || event.date;
        } else {
          user.badges.push({ eventId: event._id, eventName: event.name, level: 1, image: eventBadge, visible: true, eventEndDate: event.endDate || event.date });
        }

        // Send notification to user about badge
        try {
          await createNotificationInternal({
            recipientId: user._id,
            type: 'AWARDED_BADGE',
            message: `Bạn đã được ghi nhận hoàn thành sự kiện "${event.name}" và được trao Badge.`,
            relatedId: event._id,
            relatedModel: 'Event'
          });
        } catch (e) {
          console.warn('Failed to create notification for badge:', e);
        }
      } else {
        // Remove badge if exists
        if (existing) {
          user.badges = user.badges.filter(b => !(b.eventId && b.eventId.toString() === event._id.toString()));
        }
      }
      updates.push(user.save());
    }

    await Promise.all(updates);

    const updatedEvent = await Event.findOne({ slug })
      .populate('createdBy', 'username avatar')
      .populate('volunteers', 'username email role avatar');

    res.json({ message: 'Đã lưu đóng góp', event: updatedEvent });
  } catch (err) {
    console.error('Save Contributions Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- GET USER'S JOINED EVENTS ----------------------
export const getUserEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Tìm tất cả events mà user đã join (có trong volunteers array)
    const events = await Event.find({
      volunteers: userId,
      status: "approved" // Chỉ lấy events đã được duyệt
    })
      .populate("createdBy", "username email avatar role")
      .sort({ date: 1 }); // Sắp xếp theo ngày tăng dần

    res.json({
      message: "Lấy danh sách sự kiện thành công",
      events
    });
  } catch (err) {
    console.error("Get User Events Error:", err);
    res.status(500).json({ message: err.message });
  }
};

