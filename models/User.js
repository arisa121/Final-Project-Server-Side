import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  photo: String,
  role: { type: String, enum: ["citizen", "staff", "admin"], default: "citizen" },
  isPremium: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
