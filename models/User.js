import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
  name:{type:String,required:true},
  email: { type: String, unique: true },
   password: { type: String },
    photo: { type: String },
    phone: { type: String },
    firebaseUid: { type: String },
    role: {
      type: String,
      enum: ["citizen", "staff", "admin"],
      default: "citizen"
    },
  isPremium: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
