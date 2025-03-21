import { IStorage, StorageStatus } from "../types/types";
import mongoose, { Model, Schema, Types } from "mongoose";

// Declare the Schema of the Mongo model
const storageSchema: Schema<IStorage> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    size: { type: Number, required: true, },
    price: { type: Number, required: true, },
    status: { type: String, enum: Object.values(StorageStatus), default: StorageStatus.active },
    storageId: { type: mongoose.Schema.Types.ObjectId, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

storageSchema.pre("save", function (next) {
  if (!this.storageId) {
    this.storageId = this._id as Types.ObjectId;
  }
  next();
});

// Create the Storage model
const Storage: Model<IStorage> = mongoose.model<IStorage>("Storage", storageSchema);

export default Storage;
