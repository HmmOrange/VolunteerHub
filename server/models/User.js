import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  role: { type: String, enum: ["volunteer", "manager", "admin"], default: "volunteer" },
});

export default mongoose.model("User", userSchema);
