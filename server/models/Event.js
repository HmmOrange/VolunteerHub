import mongoose from "mongoose";
import slugify from "slugify";

// Schema con cho tính năng lặp lại (Recurrence)
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
        max: 6, // 0 = Sunday, 6 = Saturday
      },
    ],
    endDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // --- THỜI GIAN ---
    date: { type: Date, required: true }, // Ngày diễn ra
    startTime: { type: String, required: true }, // Giờ bắt đầu (VD: "18:30")
    endTime: { type: String }, // Giờ kết thúc (VD: "21:00")

    location: String,
    description: String,

    // --- QUYỀN RIÊNG TƯ (Từ phiên bản cũ) ---
    privacy: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    question: {
      type: String,
      default: "Tại sao bạn muốn tham gia sự kiện này?", // Câu hỏi nếu là Private
    },

    // --- QUẢN LÝ ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approved: { type: Boolean, default: false },
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // --- TÍNH NĂNG LẶP LẠI (Từ phiên bản mới) ---
    recurrence: {
      type: recurrenceSchema,
      default: null,
    },
  },
  { timestamps: true }
);

// Middleware tự động tạo slug nếu thiếu (Dự phòng)
eventSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

export default mongoose.model("Event", eventSchema);