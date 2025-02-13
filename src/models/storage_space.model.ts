import mongoose, { Model, Schema } from "mongoose";

// USER STORAGE SPACE
enum UserFileStorageSpace {
  BASIC_GB_5000 = "5000 GB",
  STANDARD_TB_1 = "1 TB",
  PREMIUM_TB_100 = "100 TB",
}

// Define the interface for Storage Space
interface IStorageSpace extends Document {
  storageSpaceId: string; // Unique identifier for the storage space
  user: string;
  name: string;
  size: string; // Storage size in GB
}

// Define the schema for Storage Space
const storageSpaceSchema: Schema<IStorageSpace> = new mongoose.Schema(
  {
    storageSpaceId: {
      type: String,
      unique: true,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
      default: UserFileStorageSpace.BASIC_GB_5000,
    },
  },
  { timestamps: true }
);

// Create and export the StorageSpace model
export const StorageSpace: Model<IStorageSpace> = mongoose.model<IStorageSpace>(
  "StorageSpace",
  storageSpaceSchema
);
