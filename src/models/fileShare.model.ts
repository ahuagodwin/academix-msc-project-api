import { IFileShare, UserPermission } from "../types/types";
import mongoose, { Schema } from "mongoose";


const FileShareSchema = new Schema<IFileShare>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: "User" }], // Array of users
    file: { type: Schema.Types.ObjectId, ref: "File", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    permissions: {
      type: [String],
      enum: [UserPermission.READ, UserPermission.UPDATE, UserPermission.DOWNLOAD, UserPermission.DELETE],
      default: [UserPermission.READ],
    },
  },
  { timestamps: true }
);

const FileShare = mongoose.model<IFileShare>("FileShare", FileShareSchema);
export default FileShare;
