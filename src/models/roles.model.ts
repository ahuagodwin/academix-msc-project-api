import mongoose, { Schema, Model, Document } from "mongoose";

enum UserRole {
  LECTURER = "teacher", // teachers
  STUDENT = "student", // students
  SUPER_ADMIN = "super admin", // for dean, vc, and faculty officer
  ADMIN = "admin", // for staff of the faculty, dean and vc
  HOD = "head of department", //head of a department
  HOD_ADMIN = "administrator", // for staff of the faculty
}

enum UserPermissions {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

interface IRole extends Document {
  user: string;
  roleId: string;
  name: UserRole;
  permissions: UserPermissions[];
}

// Define Role Schema
const roleSchema: Schema<IRole> = new Schema(
  {
    roleId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return new mongoose.Types.ObjectId().toString();
      },
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.SUPER_ADMIN,
    },
    permissions: {
      type: [String],
      enum: Object.values(UserPermissions),
      default: [UserPermissions.READ, UserPermissions.CREATE, UserPermissions.DELETE, UserPermissions.UPDATE],
    },
  },
  {
    timestamps: true,
  }
);

export const Role: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);
