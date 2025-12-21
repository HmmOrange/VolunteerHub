import Event from "../models/Event.js";
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";
import Post from "../models/Post.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { createNotificationInternal } from "../controllers/notificationController.js";

/**
 * Automatically create a public announcement post for an event
 * if it does not already exist.
 * @param {Object} event Event document
 * @returns {Object|undefined} Created or existing post
 */
const createEventPost = async (event) => {
  try {
    const existingAnnouncement = await Post.findOne({
      eventId: event._id,
      isEventAnnouncement: true
    });
    
    if (existingAnnouncement) {
      console.log(`Bài announcement cho sự kiện ${event.name} đã tồn tại, bỏ qua tạo mới.`);
      return existingAnnouncement;
    }
    
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
    
    const newPost = new Post({
      content,
      imageUrl: event.banner || null,
      isAnonymous: false,
      isEventAnnouncement: true, // Bài đăng tự động
      eventId: event._id,
      createdBy: event.createdBy,
      likes: []
    });
    
    await newPost.save();
    console.log(`Đã tạo bài đăng tự động cho sự kiện: ${event.name}`);
    
    return newPost;
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng tự động:", error);
  }
};

/**
 * Create a new event and notify admins for approval.
 * Automatically creates an announcement post.
 * @route POST /api/events
 * @access Authenticated
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
    const effectiveEndDate = endDate || date;
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

    const newEvent = new Event({
      name,
      slug: finalSlug,
      date, 
      endDate: effectiveEndDate, 
      startTime,
      endTime,
      location,
      description,
      banner: null,
      createdBy: user._id,
      volunteers: [user._id],
      recurrence: recurrenceData,
      privacy: privacy || "Public",
      question: privacy === "Private" ? question : "",
      status: "pending"
    });

    await newEvent.save();

    try {
      await createEventPost(newEvent);
    } catch (postError) {
      console.error("Lỗi tạo bài đăng cho sự kiện:", postError);
    }

    try {
      const admins = await User.find({ role: "admin" });

      if (admins.length > 0) {
        const notiPromises = admins.map(admin => {
          return createNotificationInternal({
            recipientId: admin._id,
            type: "EVENT_PENDING_APPROVAL",
            message: `Sự kiện mới "${name}" đang chờ bạn phê duyệt.`,
            relatedId: newEvent._id,
            relatedModel: "Event"
          });
        });

        await Promise.all(notiPromises);
        console.log(`Đã gửi thông báo cho ${admins.length} admin.`);
      }
    } catch (notiError) {
      console.error("Lỗi gửi thông báo cho Admin:", notiError);
    }

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

/**
 * Get all events.
 * Admins can filter by status, normal users only see approved events.
 * @route GET /api/events
 * @access Public / Admin
 */
export const getAllEvents = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    const isAdmin = req.user && req.user.role === "admin";
    
    if (status) {
      filter.status = status;
    } else if (!isAdmin) {
      filter.status = "approved";
    }

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
 * Get event details by slug or ID.
 * Adds user-specific metadata such as join status and permissions.
 * @route GET /api/events/:slug
 * @access Public
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
            status: event.status
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

    const attendanceMap = {};
    if (event.attendance && Array.isArray(event.attendance)) {
      event.attendance.forEach(att => {
        attendanceMap[att.user.toString()] = att.status || 'pending';
      });
    }

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
 * Join an event.
 * - Public events: user is added directly to volunteers.
 * - Private events: create or reuse a join request with status "pending".
 * Sends notifications to the event creator accordingly.
 *
 * @route POST /api/events/join
 * @access Authenticated
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string} req.body.userId ID of the user requesting to join
 * @param {string} [req.body.answer] Optional answer for private event join question
 * @returns {Object} Join result status
 */
export const joinEvent = async (req, res) => {
  try {
    const { slug, userId, answer } = req.body;

    const event = await Event.findOne({ slug });
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const userSender = await User.findById(userId);
    if (!userSender) 
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    const isAlreadyMember = event.volunteers.some(
          v => (v._id || v).toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "Bạn đã tham gia sự kiện này rồi" });
    }

    if (event.privacy === "Public") {
      await Event.updateOne(
        { _id: event._id },
        { $addToSet: { volunteers: userId } }
      );
      
      await createNotificationInternal({
        recipientId: event.createdBy,
        type: "NEW_MEMBER_JOINED",
        message: `${userSender.username} đã tham gia sự kiện "${event.name}" của bạn.`,
        relatedId: event._id,
        relatedModel: "Event"
      });

      return res.json({ message: "Tham gia thành công", status: "joined" });
    }

    const existingRequest = await JoinRequest.findOne({
      event: event._id,
      user: userId,
    });

    let finalRequest;

    if (existingRequest) {
      if (existingRequest.status === "pending") {
         return res.status(400).json({ message: "Bạn đã gửi yêu cầu, vui lòng chờ duyệt." });
      }

      existingRequest.status = "pending";
      existingRequest.answer = answer || ""; 
      existingRequest.createdAt = Date.now();
      
      finalRequest = await existingRequest.save();
      
    } else {
      const newRequest = new JoinRequest({
        event: event._id,
        user: userId,
        answer: answer || "",
        status: "pending",
      });
      finalRequest = await newRequest.save();
    }

    if (finalRequest) {
      await createNotificationInternal({
        recipientId: event.createdBy,
        type: "JOIN_REQUEST",         
        message: `${userSender.username} đã gửi yêu cầu tham gia sự kiện "${event.name}".`,
        relatedId: event._id,         
        relatedModel: "Event"
      });
    }

    res.json({ message: "Đã gửi yêu cầu tham gia", status: "pending" });

  } catch (err) {
    console.error("Join Event Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Leave an event.
 * Removes the user from the event's volunteers list
 * and deletes any existing join requests for that event.
 *
 * @route POST /api/events/leave
 * @access Authenticated
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string} req.body.userId ID of the user leaving the event
 * @returns {Object} Operation result message
 */
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

/**
 * Remove a member from an event.
 * Only the event creator or a manager can perform this action.
 * Also removes any existing join requests of the removed member
 * and sends a notification to the affected user.
 *
 * @route POST /api/events/remove-member
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string} req.body.memberId ID of the member to be removed
 * @param {string} req.body.managerId ID of the requester (manager or creator)
 * @returns {Object} Operation result message
 */
export const removeMember = async (req, res) => {
  try {
    const { slug, memberId, managerId } = req.body;

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });


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

    await Event.findOneAndUpdate(
      { slug: slug },
      { $pull: { volunteers: memberId } }
    );
    
    await JoinRequest.deleteMany({ event: event._id, user: memberId });

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
 * Update an event.
 * Allows the event creator or a manager to modify event details,
 * perform special actions (cancel, end early, extend),
 * and automatically award a badge to the event owner when completed.
 *
 * @route PUT /api/events
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string} req.body.username Username of the requester
 * @param {string} [req.body.name] Event name
 * @param {string|Date} [req.body.date] Start date
 * @param {string|Date} [req.body.endDate] End date
 * @param {string} [req.body.startTime] Start time (HH:mm)
 * @param {string} [req.body.endTime] End time (HH:mm)
 * @param {string} [req.body.location] Event location
 * @param {string} [req.body.description] Event description
 * @param {string} [req.body.privacy] Event privacy (Public / Private)
 * @param {string} [req.body.question] Join question for private events
 * @param {string|null} [req.body.banner] Event banner path
 * @param {string} [req.body.action] Special action (cancel | end_early | extend)
 * @param {number} [req.body.extendHours] Number of hours to extend the event
 * @returns {Object} Updated event document
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
    
    if (action) {
      const now = new Date();
      
      switch(action) {
        case 'cancel':
          updateFields.eventStatus = 'cancelled';
          break;
          
        case 'end_early':
          updateFields.eventStatus = 'completed';
          updateFields.endDate = now;
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          updateFields.endTime = `${hours}:${minutes}`;
          break;
          
        case 'extend':
          if (!extendHours || extendHours <= 0) {
            return res.status(400).json({ message: "Số giờ extend phải lớn hơn 0" });
          }
          
          const currentEndDate = new Date(event.endDate || event.date);
          if (event.endTime) {
            const [h, m] = event.endTime.split(':');
            currentEndDate.setHours(parseInt(h), parseInt(m), 0, 0);
          }
          
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

    // Từ trạng thái 'completed' --> trao badge cho chủ sự kiện
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
 * Delete an event.
 * Only the event creator can delete the event.
 * Notifies all current members before removing the event
 * and cleans up related join requests.
 *
 * @route DELETE /api/events
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string} req.body.username Username of the requester
 * @returns {Object} Operation result message
 */
export const deleteEvent = async (req, res) => {
  try {
    const { slug, username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const event = await Event.findOne({ slug }).populate("volunteers");
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    if (user.role !== "manager" && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sự kiện này" });
    }

    const memberIds = event.volunteers.map(v => (v._id || v).toString());

    if (memberIds.length > 0) {
      await Promise.all(
        memberIds.map(id => 
          createNotificationInternal({
            recipientId: id,
            type: "EVENT_DELETED",
            message: `Sự kiện "${event.name}" mà bạn tham gia đã bị hủy bỏ bởi ban tổ chức.`,
            relatedId: event._id,
            relatedModel: "Event"
          })
        )
      );
    }

    await JoinRequest.deleteMany({ event: event._id });
    
    await Event.findOneAndDelete({ slug });

    res.json({ message: "Xóa sự kiện thành công và đã thông báo đến tất cả thành viên!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all pending join requests for an event.
 * Only returns requests with status "pending".
 *
 * @route GET /api/events/:slug/pending-requests
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.params
 * @param {string} req.params.slug Event slug
 * @returns {Array} List of pending join requests with user info
 */
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

/**
 * Respond to a join request for an event.
 * Allows a manager or event creator to approve or reject
 * a user's request to join a private event.
 * Sends a notification to the requester with the result.
 *
 * @route POST /api/events/respond-join-request
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.requestId Join request ID
 * @param {string} req.body.action Action to take ("approve" | "reject")
 * @param {string} req.body.managerId ID of the manager/creator handling the request
 * @returns {Object} Operation result with updated request status
 */
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
      
      // Thông báo duyệt thành viên
      await createNotificationInternal({
        recipientId: request.user,
        type: "VOLUNTEER_ACCEPTED",
        message: `Chúc mừng! Yêu cầu tham gia sự kiện "${event.name}" của bạn đã được chấp nhận.`,
        relatedId: event._id,
        relatedModel: "Event"
      });

    } else {
      request.status = "rejected";
      
      // Thông báo từ chối thành viên
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

/**
 * Approve an event.
 * Admin-only action that marks an event as approved,
 * records the approval time, and notifies the event creator.
 *
 * @route PUT /api/admin/events/:id/approve
 * @access Admin
 * @param {Object} req.params
 * @param {string} req.params.id Event ID
 * @returns {Object} Approval result and updated event
 */
export const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.status = "approved";
    event.approvedAt = new Date();
    await event.save();

    // Thông báo cho người tạo sự kiện
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

/**
 * Remove multiple members from an event in a single operation.
 * Only the event creator or a manager can perform this action.
 *
 * @route POST /api/events/batch-remove-members
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string[]} req.body.memberIds Array of member user IDs to remove
 * @param {string} req.body.username Username of the requester
 * @returns {Object} Updated event document
 */
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

    // Kiểm tra quyền manager và người tạo event
    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

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

/**
 * Grant manager role to multiple event members in a single operation.
 * Only the event creator or an existing manager can perform this action.
 *
 * @route POST /api/events/batch-grant-manager
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string[]} req.body.memberIds Array of member user IDs to promote
 * @param {string} req.body.username Username of the requester
 * @returns {Object} Updated event document
 */
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


    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

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

/**
 * Mark attendance for multiple event members in a single operation.
 * Only the event creator or a manager can perform this action.
 *
 * @route POST /api/events/batch-mark-attendance
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.body
 * @param {string} req.body.slug Event slug
 * @param {string[]} req.body.memberIds Array of member user IDs
 * @param {string} req.body.attended Attendance status ("yes" | "no")
 * @param {string} req.body.username Username of the requester
 * @returns {Object} Updated event document
 */
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

    const userVolunteer = event.volunteers.find(v => v.user._id.toString() === user._id.toString());
    const isCreator = event.createdBy.toString() === user._id.toString();
    const isManager = userVolunteer && userVolunteer.role === "manager";

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

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

/**
 * Reject an event.
 * Admin-only action that marks an event as rejected
 * and notifies the event creator about the decision.
 *
 * @route PUT /api/admin/events/:id/reject
 * @access Admin
 * @param {Object} req.params
 * @param {string} req.params.id Event ID
 * @returns {Object} Rejection result and updated event
 */
export const rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Sự kiện không tồn tại" });

    event.status = "rejected";
    await event.save();

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
 * Update attendance status for a specific event member.
 * Only the event creator or a manager can perform this action.
 * Automatically awards or removes event badges based on attendance status.
 *
 * @route PUT /api/events/:slug/attendance
 * @access Authenticated (Manager / Creator)
 * @param {Object} req.params
 * @param {string} req.params.slug Event slug
 * @param {Object} req.body
 * @param {string} req.body.userId ID of the member
 * @param {string} req.body.attendance Attendance status ("completed" | "absent" | "pending")
 * @param {string} [req.body.requesterId] Fallback requester ID if req.user is not present
 * @returns {Object} Operation result with updated attendance status
 */
export const updateMemberAttendance = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId, attendance } = req.body;
    const requesterId = req.user?.id || req.body.requesterId;

    if (!userId || !attendance) {
      return res.status(400).json({ message: "Thiếu userId hoặc attendance" });
    }

    if (!['completed', 'absent', 'pending'].includes(attendance)) {
      return res.status(400).json({ message: "Trạng thái attendance không hợp lệ" });
    }

    const event = await Event.findOne({ slug })
      .populate("createdBy", "_id username")
      .populate("volunteers", "_id username role");

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

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

    const userInVolunteers = event.volunteers?.some(
      v => v._id.toString() === userId
    );

    if (!userInVolunteers) {
      return res.status(404).json({ 
        message: "Người dùng này không phải là thành viên của sự kiện" 
      });
    }

    if (!event.attendance) {
      event.attendance = [];
    }

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

/**
 * Search events.
 * Returns all approved events with basic information
 * and includes the number of volunteers for each event.
 *
 * @route GET /api/events/search
 * @access Public
 * @param {Object} req.query
 * @param {string} [req.query.query] Search keyword (currently unused)
 * @returns {Array} List of approved events with volunteer count
 */
export const searchEvents = async (req, res) => {
  try {
    const { query } = req.query;
    
    const events = await Event.find({ status: "approved" })
      .populate("createdBy", "username role avatar")
      .select("name slug date endDate startTime endTime location description banner createdAt status volunteers")
      .lean();

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
 * Upload or update an event banner.
 * Only the event creator, manager, or admin can perform this action.
 * Replaces the old banner file if it exists and updates
 * the automatic announcement post image if available.
 *
 * @route POST /api/events/:slug/banner
 * @access Authenticated (Creator / Manager / Admin)
 * @param {Object} req.params
 * @param {string} req.params.slug Event slug
 * @param {Object} req.file Uploaded banner file (via multer)
 * @returns {Object} Operation result with updated banner path
 */
export const uploadEventBanner = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "manager" || req.user.role === "admin";

    if (!isCreator && !isManager) {
      return res.status(403).json({ 
        message: "Bạn không có quyền cập nhật banner cho sự kiện này" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Không có file banner được upload" });
    }

    if (event.banner) {
      const fs = await import("fs");
      const oldPath = event.banner.startsWith("/") ? `.${event.banner}` : event.banner;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const bannerPath = `/uploads/banners/${req.file.filename}`;
    event.banner = bannerPath;
    await event.save();

    try {
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
 * Upload or update an event badge.
 * Only the event creator, manager, or admin can perform this action.
 * Replaces the old badge file if it exists.
 *
 * @route POST /api/events/:slug/badge
 * @access Authenticated (Creator / Manager / Admin)
 * @param {Object} req.params
 * @param {string} req.params.slug Event slug
 * @param {Object} req.file Uploaded badge file (via multer)
 * @returns {Object} Operation result with updated badge path
 */
export const uploadEventBadge = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });

    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isManager = req.user.role === "manager" || req.user.role === "admin";
    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật badge cho sự kiện này" });
    }

    if (!req.file) return res.status(400).json({ message: "Không có file badge được upload" });

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
 * Save member contributions for an event.
 * Only the event creator can perform this action.
 * Updates contribution completion status and
 * automatically awards or removes event badges for members.
 *
 * @route PUT /api/events/:slug/contributions
 * @access Authenticated (Creator)
 * @param {Object} req.params
 * @param {string} req.params.slug Event slug
 * @param {Object} req.body
 * @param {Object.<string, boolean>} req.body.contributions
 *        Key-value map of userId => completion status
 * @returns {Object} Operation result with updated event data
 */
export const saveContributions = async (req, res) => {
  try {
    const { slug } = req.params;
    const { contributions } = req.body;

    if (!contributions || typeof contributions !== 'object') {
      return res.status(400).json({ message: 'Contributions invalid' });
    }

    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: 'Sự kiện không tồn tại' });

    // Kiểm tra quyền người tạo sự kiện
    const requesterId = req.user._id.toString();
    const isCreator = event.createdBy.toString() === requesterId;
    if (!isCreator) return res.status(403).json({ message: 'Bạn không có quyền cập nhật đóng góp' });

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

    // Gắn/loại bỏ badge cho từng user dựa trên đóng góp
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
        if (existing) {
          existing.level = existing.level || 1;
          existing.image = eventBadge;
          existing.eventName = event.name;
          existing.eventEndDate = event.endDate || event.date;
        } else {
          user.badges.push({ eventId: event._id, eventName: event.name, level: 1, image: eventBadge, visible: true, eventEndDate: event.endDate || event.date });
        }

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

/**
 * Get all events that a user has joined.
 * Only returns events that have been approved.
 *
 * @route GET /api/users/:userId/events
 * @access Authenticated / Public (depends on route protection)
 * @param {Object} req.params
 * @param {string} req.params.userId User ID
 * @returns {Object} List of approved events the user has joined
 */
export const getUserEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const events = await Event.find({
      volunteers: userId,
      status: "approved" 
    })
      .populate("createdBy", "username email avatar role")
      .sort({ date: 1 }); 

    res.json({
      message: "Lấy danh sách sự kiện thành công",
      events
    });
  } catch (err) {
    console.error("Get User Events Error:", err);
    res.status(500).json({ message: err.message });
  }
};

