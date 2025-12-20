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
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },

    location: String,
    description: String,

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

    // 🔴 REPLACEMENT FOR `approved`
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

    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

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
