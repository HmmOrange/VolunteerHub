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
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // Start DATE (not time)
    date: { type: Date, required: true },

    // ⏰ TIME FIELDS (NEW)
    startTime: {
      type: String, // "18:30"
      required: true,
    },
    endTime: {
      type: String, // "20:00"
    },

    location: String,
    description: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approved: { type: Boolean, default: false },
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    recurrence: {
      type: recurrenceSchema,
      default: null,
    },
  },
  { timestamps: true }
);

eventSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.slug) {
    this.slug = slugify(this.slug, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Event", eventSchema);
