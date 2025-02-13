
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose, { Schema, Document, Model,Types } from 'mongoose';

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
  userId: string;
  balance: number;
  currency: string;
  transactions: ITransaction[];
  deposit(amount: number, description?: string): Promise<void>;
  withdraw(amount: number, description?: string): Promise<boolean>;
}

// USER ROLE
enum UserRole {
  LECTURER = "teacher", // teachers
  STUDENT = "student", // students
  SUPER_ADMIN = "super admin", // for dean, vc, and faculty officer
  ADMIN = "admin", // for staff of the faculty, dean and vc
  HOD = "head of department", //head of a department
  HOD_ADMIN = "administrator", // for staff of the faculty
}

// USER STORAGE SPACE
enum UserFileStorageSpace {
  BASIC_GB_5000 = "5000 GB",
  STANDARD_TB_1 = "1 TB",
  PREMIUM_TB_100 = "100 TB",
}

enum UserSchool {
  IAU = "Ignatius Ajuru University",
  RSU = "Rivers State University",
  UNIPORT = "University of Port Harcourt",
}

interface ISchool extends Document {
  schoolId: string; // Unique identifier for the School
  name: UserSchool;
  userId: string; // Referencing to the user associated with the School
  code: string // school abbreviation
}

// Define the interface for a User document
export interface IUser extends Document {
  id?: string
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
}

// Define the Schema for the User model
const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      default: function (this: IUser) {
        return this._id?.toString()
      },
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
    role: { type: String, ref: "Role", default: UserRole.SUPER_ADMIN, required: true },
    schoolName: {
      type: String,
      ref: "School",
      required: true,
      default: UserSchool.IAU
    },
    storage_space: {
      type: String,
      ref: "StorageSpace",
      required: true,
      default: UserFileStorageSpace.BASIC_GB_5000
    },
    wallet: {
      type: String,
      ref: "Wallet",
      default: null,
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified('password')) {
    this.passwordChangedAt = new Date();
  }
  next();
});


// Compare entered password with the hashed password
userSchema.methods.isPasswordMatched = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create a password reset token and set expiration date
userSchema.methods.createPasswordResetToken = async function (): Promise<string> {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  return resetToken;
};


// Check if password reset token has expired
userSchema.methods.isPasswordResetTokenExpired = function (): boolean {
  return Date.now() > this.passwordResetExpires?.getTime();
};

// Export the model with proper typing
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
