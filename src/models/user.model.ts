
import { IUser, UserType } from '../types/types';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose, { Schema, Model, model, Types } from "mongoose";


// Defining the schema
const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, minlength: 2, maxlength: 50 },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true, 
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    phoneNumber: { type: String, required: true, unique: true, minlength: 11, maxlength: 11, },
    userId: { type: mongoose.Schema.Types.ObjectId,  unique: true,},
    password: { type: String, required: true, minlength: 6 },
    position: { type: String, required: false, trim: true },
    user_type: { type: String, enum: Object.values(UserType), required: true },
    faculty: { type: String, required: function () {
      return this.user_type === UserType.STUDENT || this.user_type === UserType.TEACHER;
    },  trim: true },
    department: { type: String, required: function () {
      return this.user_type === UserType.STUDENT || this.user_type === UserType.TEACHER;
    }, trim: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: function () {
      return this.user_type === UserType.STUDENT || this.user_type === UserType.TEACHER;
    } },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
    storage_spaces: { type: Schema.Types.ObjectId, ref: "Storage" },
    assignedFaculty: [{ type: mongoose.Schema.Types.ObjectId, required: false, trim: true }],
    assignedDepartment: [{ type: mongoose.Schema.Types.ObjectId, required: false, trim: true }],
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, required: false, trim: true }],
    verified: { type: Boolean, default: false },
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
        type: String,
        select: false,
        default: null
      },
      forgotPasswordCodeValidation: {
        type: String,
        select: false,
        default: null
      },
    refreshToken: { type: String, default: null },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  { timestamps: true }
);

// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
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

userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = this._id as Types.ObjectId;
  }
  next();
});

// Creating the model
const User: Model<IUser> = model<IUser>("User", userSchema);

export { User };
