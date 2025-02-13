import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from 'crypto';

enum ManagementStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  DELETED = "deleted",
  PENDING = "pending",
  OFFLINE = "offline",
}

// Define Role Interface
interface IRole extends Document {
    name: string;
    permissions: string[];
  }
  
  interface ITransaction {
    type: "deposit" | "withdrawal";
    amount: number;
    timestamp: Date;
    description?: string;
    status: "pending" | "completed" | "failed";
  }
  
  interface IWallet extends Document {
    walletId: string;
    ManagementId: string;
    balance: number;
    currency: string;
    transactions: ITransaction[];
    deposit(amount: number, description?: string): Promise<void>;
    withdraw(amount: number, description?: string): Promise<boolean>;
  }
  
  // Management ROLE
  enum ManagementRole {
    LECTURER = "teacher", // teachers
    STUDENT = "student", // students
    SUPER_ADMIN = "super admin", // for dean, vc, and faculty officer
    ADMIN = "admin", // for staff of the faculty, dean and vc
    HOD = "head of department", //head of a department
    HOD_ADMIN = "administrator", // for staff of the faculty
  }
  
  // Management STORAGE SPACE
  enum ManagementFileStorageSpace {
    BASIC_GB_5000 = "5000 GB",
    STANDARD_TB_1 = "1 TB",
    PREMIUM_TB_100 = "100 TB",
  }
  
  enum ManagementSchool {
    IAU = "Ignatius Ajuru University",
    RSU = "Rivers State University",
    UNIPORT = "University of Port Harcourt",
  }
  
  interface ISchool extends Document {
    schoolId: string; // Unique identifier for the School
    name: ManagementSchool;
    ManagementId: string; // Referencing to the Management associated with the School
    code: string // school abbreviation
  }
  
  // Define the interface for a Management document
  export interface IManagement extends Document {
    adminId?: string
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    password: string;
    verified: boolean;
    verificationCode: string | null;
    verificationCodeValidation: string | null;
    emailVerified: boolean;
    emailVerificationCode: string | null;
    emailVerificationCodeValidation: string | null;
    forgotPasswordCode: string | null;
    forgotPasswordCodeValidation: string | null;
    isPasswordMatched(enteredPassword: string): Promise<boolean>;
    isBlocked: boolean;
    refreshToken: string;
    role: string | IRole;
    schoolName: string | ISchool;
    storage_space: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createPasswordResetToken(): Promise<string>;
    wallet: string | IWallet; 
    status: ManagementStatus
  }

// Define the Schema for the Management model
const ManagementSchema: Schema<IManagement> = new mongoose.Schema(
  {
    adminId: {
      type: String,
      unique: true,
      required: true,
      default: function (this: IManagement) {
        return this._id?.toString()},
    },
    firstName: {
      type: String,
      required: true,
      // set: encryptData
    },
    lastName: {
      type: String,
      required: true,
      // set: encryptData
    },
    email: {
      type: String, 
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    verified: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    verificationCode: {
      type: String,
      select: false
    },
    verificationCodeValidation: {
      type: String,
      select: false
    },
    emailVerificationCode: {
      type: String,
      select: false
    },
    emailVerificationCodeValidation: {
      type: String,
      select: false
    },
    forgotPasswordCode: {
      type: Number,
      select: false,
      default: null
    },
    forgotPasswordCodeValidation: {
      type: Number,
      select: false,
      default: null
    },
    refreshToken: {
      type: String
    },
    role: { type: String, ref: "Role", default: ManagementRole.ADMIN, required: true },
    schoolName: {
      type: String,
      ref: "School",
      required: true,
      default: ManagementSchool.IAU
    },
    storage_space: {
      type: String,
      ref: "StorageSpace",
      required: true,
      default: ManagementFileStorageSpace.BASIC_GB_5000
    },
    wallet: {
      type: String,
      ref: "Wallet",
    //   default: null,
    },
    status: {
        type: String,
        enum: Object.values(ManagementStatus),
        default: ManagementStatus.PENDING,
      },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving it to the database
ManagementSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified('password')) {
    this.passwordChangedAt = new Date();
  }
  next();
});


// Compare entered password with the hashed password
ManagementSchema.methods.isPasswordMatched = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a password reset token and set expiration date
ManagementSchema.methods.createPasswordResetToken = async function (): Promise<string> {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  return resetToken;
};


// Check if password reset token has expired
ManagementSchema.methods.isPasswordResetTokenExpired = function (): boolean {
  return Date.now() > this.passwordResetExpires?.getTime();
};

export const Management: Model<IManagement> = mongoose.model<IManagement>("Management", ManagementSchema);
