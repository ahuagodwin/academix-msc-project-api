import mongoose, { Model, Schema } from "mongoose";

// USER STORAGE SPACE
enum UserFileStorageSpace {
  BASIC_GB_4 = "4 GB",
  STANDARD_GB_10 = "10 GB",
  PREMIUM_GB_20 = "20 GB",
}

enum UserFileStorageSpaceName {
  BASIC = "Basic",
  STANDARD = "Standard",
  PREMIUM = "Premium",
}

// Define the interface for Storage Space
interface IStorageSpace extends Document {
  storageSpaceId: string; // Unique identifier for the storage space
  user: string;
  name: string;
  size: UserFileStorageSpace; // Storage size in GB
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
      unique: true,
      default: UserFileStorageSpaceName.PREMIUM
    },
    size: {
      type: String,
      required: true,
      enum: Object.values(UserFileStorageSpace),
      default: UserFileStorageSpace.PREMIUM_GB_20,
    },
  },
  { timestamps: true }
);

// Create and export the StorageSpace model
export const StorageSpace: Model<IStorageSpace> = mongoose.model<IStorageSpace>(
  "StorageSpace",
  storageSpaceSchema
);
