/**
 * Model Event
 * - Mô tả: Lưu thông tin sự kiện, bao gồm thời gian, địa điểm, creator, trạng thái phê duyệt, volunteers,
 *   badge, contributions, attendance và cấu hình lặp lại (recurrence).
 * - Sử dụng middleware pre-validate để tự động tạo `slug` dựa trên `name` nếu cần.
 */
import mongoose from "mongoose";
import slugify from "slugify";

const recurrenceSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
    },
    interval: {
      type: Number,
      min: 1,
      default: 1,
    },
    daysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
      },
    ],
    endDate: {
      type: Date,
      default: null,
      required: function () {
        return this.enabled === true;
      },
    }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // --- THỜI GIAN ---
    date: { type: Date, required: true },     
    endDate: { type: Date, required: true },     
    startTime: { type: String, required: true }, 
    endTime: { type: String },                 

    location: String,
    description: String,
    banner: {
      type: String,
      default: "/uploads/banners/default.jpg",
    },

    // --- QUYỀN RIÊNG TƯ ---
    privacy: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    question: {
      type: String,
      default: "Tại sao bạn muốn tham gia sự kiện này?",
    },

    // --- QUẢN LÝ ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- PHÊ DUYỆT SỰ KIỆN ---
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // --- TRẠNG THÁI SỰ KIỆN ---
    eventStatus: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },

    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // --- BADGE FOR EVENT (OPTIONAL) ---
    // Default badge image path (use default image until owner uploads a custom one)
    badge: {
      type: String,
      default: "/uploads/badges/default.jpg"
    },

    // --- CONTRIBUTIONS: store completion boolean per volunteer (owner marks completed) ---
    contributions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completed: { type: Boolean, default: false }
    }],

    // --- TRẠNG THÁI THAM GIA CỦA VOLUNTEERS ---
    attendance: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ['pending', 'completed', 'absent'],
        default: 'pending'
      }
    }],

    // --- TÍNH NĂNG LẶP LẠI ---
    recurrence: {
      type: recurrenceSchema,
      default: null,
    },
  },
  { timestamps: true }
);

// Middleware tự động tạo slug nếu thiếu
eventSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

export default mongoose.model("Event", eventSchema);
