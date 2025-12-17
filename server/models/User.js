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
