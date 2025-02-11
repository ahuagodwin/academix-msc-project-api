import mongoose, { Schema, Document, Model, Types } from "mongoose";
import User from "./user.Model";

interface AuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  status: string;
  timestamp: Date;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const AuditLogSchema: Schema<AuditLog> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true, // e.g., "success", "failure"
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: "", 
    },
    location: {
      type: String,
      default: "", 
    },
    userAgent: {
      type: String,
      default: "", // Default empty string if not provided
    },
    // Optionally populate these fields if needed
    firstName: {
      type: String,
      default: "", // Optional but default empty string
    },
    lastName: {
      type: String,
      default: "", // Optional but default empty string
    },
    email: {
      type: String,
      default: "", // Optional but default empty string
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.pre('save', async function(next) {
  const user = await User.findById(this.userId);
  if (user) {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
  }
  next();
});
// Export the model with proper typing
const AuditLogModel: Model<AuditLog> = mongoose.model<AuditLog>(
  "AuditLog",
  AuditLogSchema
);

export default AuditLogModel;
