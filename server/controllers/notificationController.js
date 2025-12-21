import Notification from "../models/Notification.js";
import mongoose from "mongoose";

// 1. Lấy thông báo
// 1. Lấy thông báo
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    // Populate giúp lấy luôn thông tin chi tiết của Event/Post/Comment đi kèm thông báo
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate({
         path: 'relatedId', 
         // Chỉ lấy các trường cần thiết để Frontend xử lý (nhẹ server)
         // select: 'name title content event post' 
      })
      .populate('recipient', 'username avatar'); // (Tùy chọn) lấy thêm info người nhận nếu cần

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    
    res.status(200).json({ 
      success: true,
      notifications, 
      unreadCount 
    });
  } catch (error) {
    console.error("Lỗi getUserNotifications:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 2. Đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  try {
    // Vì route là /:notificationId/read nên params phải lấy notificationId
    const { notificationId } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({ message: "ID thông báo không hợp lệ" });
    }

    const updatedNoti = await Notification.findByIdAndUpdate(
        notificationId, 
        { isRead: true },
        { new: true } // Trả về document mới sau khi update
    );

    if (!updatedNoti) {
        return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    
    res.status(200).json({ message: "Đã đánh dấu đã đọc", notification: updatedNoti });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 3. Tạo thông báo nội bộ
export const createNotificationInternal = async ({ recipientId, type, message, relatedId, relatedModel }) => {
  try {
    if (!recipientId) return;
    const newNoti = new Notification({
      recipient: recipientId,
      type,
      message,      
      relatedId,
      relatedModel
    });
    await newNoti.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// 3. Đánh dấu tất cả thông báo của user là đã đọc
export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Trả về số lượng đã cập nhật
    res.status(200).json({ message: "Đã đánh dấu tất cả đã đọc", modifiedCount: result.modifiedCount || result.nModified || 0 });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};