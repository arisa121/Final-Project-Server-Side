import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User" },
  issue: { type: mongoose.Schema.ObjectId, ref: "Issue" },
  amount: Number,
  type: String, // "premium" or "boost"
  txnId: String,
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
