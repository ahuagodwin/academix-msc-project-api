import { IInflowAmount } from "../types/types";
import mongoose, { Schema } from "mongoose";


const InflowAmountSchema = new Schema<IInflowAmount>(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      purchasedBy: { type: String, required: true },
      transactionType: { type: String, enum: ["wallet_funding", "storage_purchase"], required: true },
      timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );
  
  export const InflowAmount = mongoose.model<IInflowAmount>("InflowAmount", InflowAmountSchema);
