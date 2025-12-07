import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.ObjectId, ref: "Issue" },
  message: String,
  status: String,
  updatedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  role: String,
}, { timestamps: true });

export default mongoose.model("TimeLine", timelineSchema);
