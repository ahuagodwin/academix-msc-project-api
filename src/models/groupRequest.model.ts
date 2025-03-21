import { IGroupRequest } from "../types/types";
import mongoose, { Schema, Document } from "mongoose";


const GroupRequestSchema = new Schema<IGroupRequest>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    },
    { timestamps: true }
);

const GroupRequest = mongoose.model<IGroupRequest>("GroupRequest", GroupRequestSchema);
export default GroupRequest;
