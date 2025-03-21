import { IWallet } from "@/types/types";
import mongoose, { Schema, Model, Document } from "mongoose";

// Define Transaction Schema
const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { _id: false }
);

// Define Wallet Schema
const walletSchema: Schema<IWallet & Document> = new Schema(
  {
    balance: {
      type: Number,
      default: 0.0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    transactions: [transactionSchema], // Explicitly defining transactions
  },
  {
    timestamps: true,
  }
);

// **Deposit Money**
walletSchema.methods.deposit = async function (amount: number, description = "Deposit") {
  if (amount <= 0) throw new Error("Deposit amount must be greater than zero.");

  this.balance += amount;
  this.transactions.push({
    type: "deposit",
    amount,
    description,
    timestamp: new Date(),
    status: "completed", // Auto-complete deposit
  });

  await this.save();
};

// **Withdraw Money**
walletSchema.methods.withdraw = async function (amount: number, description = "Withdrawal"): Promise<boolean> {
  if (amount <= 0) throw new Error("Withdrawal amount must be greater than zero.");
  if (this.balance < amount) throw new Error("Insufficient funds.");

  this.balance -= amount;
  this.transactions.push({
    type: "withdrawal",
    amount,
    description,
    timestamp: new Date(),
    status: "pending", // Keep pending until processed
  });

  await this.save();
  return true;
};

// Export the Wallet model
const Wallet: Model<IWallet & Document> = mongoose.model<IWallet & Document>("Wallet", walletSchema);
export default Wallet;
