import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Road", "Garbage", "Water", "Electricity"],
      required: true,
    },
    images: [String],
    location: {
      address: String,
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress","working", "resolved", "closed","rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["normal", "high"],
      default: "normal",
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: String }], // Store user IDs or emails
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isBoosted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.model("Issue", issueSchema);