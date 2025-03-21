import { IFile } from "../types/types";
import mongoose, {  Schema } from "mongoose";
const FileSchema = new Schema<IFile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: { type: String, enum: ["active", "archived", "deleted"], default: "active" },
    access: { type: String, enum: ["private", "public", "restricted"], default: "private" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

const File = mongoose.model<IFile>("File", FileSchema);
export default File;
