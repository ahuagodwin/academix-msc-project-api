import { IStorage, StorageSize, StorageStatus } from "../types/types";
import mongoose, { Model, Schema } from "mongoose";

// Declare the Schema of the Mongo model
const storageSchema: Schema<IStorage> = new Schema(
  {
    name: { type: String, required: true },
    size: { type: Number, required: true, enum: Object.values(StorageSize), default: StorageSize.IGB },
    usedStorage: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(StorageStatus), default: StorageStatus.active },
  },
  { timestamps: true }
);

// Create the Storage model
const Storage: Model<IStorage> = mongoose.model<IStorage>("Storage", storageSchema);

export default Storage;
