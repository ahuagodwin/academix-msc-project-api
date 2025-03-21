import mongoose, { Document, Schema } from "mongoose";

export interface IOutflowAmount extends Document {
  amount: number;
  description?: string;
  recipient_account: string;
  recipient_bank: string;
  transaction_reference: string;
  status: "pending" | "completed" | "failed" | "successful";
  timestamp: Date;
}

const OutflowAmountSchema = new Schema<IOutflowAmount>({
  amount: { type: Number, required: true },
  description: { type: String },
  recipient_account: { type: String, required: true },
  recipient_bank: { type: String, required: true },
  transaction_reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "completed", "failed", "successful"], default: "pending" },
  timestamp: { type: Date, default: Date.now },
});

export const OutflowAmount = mongoose.model<IOutflowAmount>("OutflowAmount", OutflowAmountSchema);
