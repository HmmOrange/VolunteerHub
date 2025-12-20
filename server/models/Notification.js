import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    type: { 
      type: String, 
      enum: [
        "EVENT_APPROVED", "EVENT_REJECTED", 
        "VOLUNTEER_ACCEPTED", "VOLUNTEER_REJECTED", 
        "POST_LIKED", 
        "POST_COMMENTED", // <-- Đã có cái này
        "POST_DELETED_BY_OWNER",
        "EVENT_PENDING_APPROVAL",
        "NEW_MEMBER_JOINED",
        "JOIN_REQUEST",
        "EVENT_DELETED",
        "MEMBER_REMOVED"
      ], 
      required: true 
    },
    
    message: { type: String, required: true },
    
    // === SỬA ĐOẠN NÀY ===
    relatedId: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Thêm dòng này: Mongoose sẽ nhìn vào field 'relatedModel' để biết ID này thuộc bảng nào
      refPath: 'relatedModel' 
    },
    
    relatedModel: {
      type: String,
      // Thêm "Comment" vào đây
      enum: ["Event", "Post", "Comment"], 
      required: true
    },
    // =====================

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);