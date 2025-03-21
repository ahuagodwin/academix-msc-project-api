

import { IRole } from "@/types/types"
import mongoose, { Schema, Model, Types } from "mongoose";

const RoleSchema: Schema<IRole> = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  permissions: { type: [String], required: true, default: [] },
  roleId: { type: mongoose.Schema.Types.ObjectId, unique: true },
  routes: [
    {
      name: { type: String, required: true },
      path: { type: String, required: true },
    },
  ],
});


RoleSchema.pre("save", function (next) {
  if (!this.roleId) {
    this.roleId = this._id as Types.ObjectId;
  }
  next();
});

// Create the Permission model
const Role: Model<IRole> = mongoose.model<IRole>(
  "Role",
  RoleSchema
);

export default Role;