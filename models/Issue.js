import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  image: String,
  location: String,

  status: {
    type: String,
    enum: ["pending", "in-progress", "working", "resolved", "closed"],
    default: "pending"
  },

  priority: { type: String, enum: ["normal", "high"], default: "normal" },

  reporter: { type: mongoose.Schema.ObjectId, ref: "User" },
  assignedTo: { type: mongoose.Schema.ObjectId, ref: "User" },

  upvotes: [{ type: mongoose.Schema.ObjectId, ref: "User" }]

}, { timestamps: true });

export default mongoose.model("Issue", issueSchema);
