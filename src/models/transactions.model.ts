import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transactionReference: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paymentGateway: { type: String, enum: ["flutterwave"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Transaction = mongoose.model("Transaction", TransactionSchema);
