/**
 * Model JoinRequest
 * - Mô tả: Lưu yêu cầu tham gia sự kiện của user (dành cho event private).
 * - Trường chính: `event`, `user`, `answer`, `status`, `attendance`.
 * - Có index unique trên { event, user } để tránh gửi nhiều request đồng thời.
 */
import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answer: { type: String, required: true }, // Câu trả lời của user
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  // Trạng thái tham gia sau khi sự kiện kết thúc
  attendance: {
    type: String,
    enum: ['pending', 'completed', 'absent'],
    default: 'pending'
  }
}, { timestamps: true });

// Đảm bảo 1 user chỉ gửi 1 request cho 1 event tại 1 thời điểm
joinRequestSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model("JoinRequest", joinRequestSchema);