/**
 * Model User
 * - Mô tả: Thông tin tài khoản người dùng, profile, role, badges và trạng thái tài khoản.
 * - Trường quan trọng: `email`, `username`, `password` (hashed), `fullName`, `role`, `badges`, `isLocked`.
 */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,   // ✅ normalize
    trim: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,    // ⚠️ must be hashed in controller
  },

  // ===== PROFILE INFO =====
  fullName: {
    type: String,
    required: true,    // matches step-2 requirement
    trim: true,
  },

  dateOfBirth: {
    type: Date,
  },

  address: {
    type: String,
    trim: true,
  },

  avatar: {
    type: String,      // URL for now
  },

  // Badges earned from events
  badges: [
    {
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
      eventName: String,
      level: Number,
      image: String, // path to badge image
      visible: { type: Boolean, default: true }
    }
  ],
  // users can choose which badges are visible on their profile
  // stored as part of each badge object via `visible` flag (default true)

  // ===== ACCOUNT STATE =====
  role: {
    type: String,
    enum: ["volunteer", "manager", "admin"],
    default: "volunteer",
  },

  isLocked: {
    type: Boolean,
    default: false,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
