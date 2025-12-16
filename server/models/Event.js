import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  location: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean, default: false },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  privacy: { 
    type: String, 
    enum: ['Public', 'Private'], 
    default: 'Public' 
  },
  question: { 
    type: String, 
    default: "Tại sao bạn muốn tham gia sự kiện này?"
  },
});

export default mongoose.model("Event", eventSchema);
