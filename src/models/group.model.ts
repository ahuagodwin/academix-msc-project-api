import mongoose, { Schema } from "mongoose";
import { IGroup } from "../types/types";

  
  const GroupSchema = new Schema<IGroup>(
    {
      name: { type: String, required: true },
      owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
      members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      files: [{ type: Schema.Types.ObjectId, ref: "File" }],
    },
    { timestamps: true }
  );
  
  const Group = mongoose.model<IGroup>("Group", GroupSchema);
  export default Group;
  