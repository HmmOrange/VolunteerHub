import mongoose from "mongoose";
import slugify from "slugify";

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  date: { type: Date, required: true },
  location: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean, default: false },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

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
