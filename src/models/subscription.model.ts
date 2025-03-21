import mongoose, { Schema, Document, Model } from "mongoose";
import { StorageStatus } from "../types/types"; // Import StorageStatus Enum

export interface IStoragePurchase extends Document {
  user: mongoose.Types.ObjectId;
  storage: mongoose.Types.ObjectId;
  totalStorage: number; 
  usedStorage: number; 
  amount: number;
  purchasedAt: Date; 
  status: StorageStatus; 
}

const storagePurchaseSchema: Schema<IStoragePurchase> = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storage: { type: mongoose.Schema.Types.ObjectId, ref: "Storage", required: true },
    totalStorage: { 
      type: Number, 
      required: true,
      min: [1, "Total storage must be greater than 0."]
    },
    amount: { 
      type: Number, 
      required: true,
      min: [0, "Amount must be a positive number."]
    },
    usedStorage: { 
      type: Number, 
      default: 0,
      min: [0, "Used storage cannot be negative."],
      validate: {
        validator: function (this: IStoragePurchase, value: number) {
          return value <= this.totalStorage;
        },
        message: "Used storage cannot exceed total storage size.",
      },
    },
    purchasedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: Object.values(StorageStatus), 
      default: StorageStatus.active 
    },
  },
  { timestamps: true }
);

// Middleware to update storage status dynamically
storagePurchaseSchema.pre("save", function (next) {
  if (this.usedStorage < 0) {
    return next(new Error("Used storage cannot be negative."));
  }

  const usagePercentage = (this.usedStorage / this.totalStorage) * 100;

  if (this.usedStorage >= this.totalStorage) {
    this.status = StorageStatus.exhausted;
  } else if (usagePercentage >= 80) {
    this.status = StorageStatus.low;
  } else {
    this.status = StorageStatus.active;
  }

  next();
});

// Create the model
const StoragePurchase: Model<IStoragePurchase> = mongoose.model<IStoragePurchase>("StoragePurchase", storagePurchaseSchema);

export default StoragePurchase;
