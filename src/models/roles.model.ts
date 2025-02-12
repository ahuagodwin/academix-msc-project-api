import mongoose, { Schema, Model, Document } from 'mongoose';

enum UserRole {
    LECTURER = "teacher",
    ADMIN = "admin",
    STUDENT = "student",
    STAFF = "staff",
    SUPER = "super admin"
  }


  enum UserPermissions {
    READ = "read",
    WRITE = "write",
    DELETE = "delete",
    UPDATE = "update"
  }

  interface IRole extends Document {
    user: string
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
        }
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
      default: UserRole.STUDENT
    },
    permissions: {
      type: [String],
      enum: Object.values(UserPermissions),
      default: [UserPermissions.READ],
    },
  },
  {
    timestamps: true,
  }
);

export const Role: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);