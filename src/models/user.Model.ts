
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
  user: Types.ObjectId;
  balance: number;
  currency: string;
  transactions: ITransaction[];
  deposit(amount: number, description?: string): Promise<void>;
  withdraw(amount: number, description?: string): Promise<boolean>;
}


// USER ROLE
enum UserRole {
  LECTURER = "teacher",
  ADMIN = "admin",
  STUDENT = "student",
  STAFF = "staff"
}


// USER DEPARTMENT
enum UserDepartment {
  COMPUTER_SCIENCE = "Computer Science",
  ENGLISH = "English",
  MATHS = "Mathematics",
  SCIENCE = "Science",
  SOCIAL_STUDIES = "Social Studies",
}

// USER FACULTY
enum UserFaculty {
  ICT = "Information and Communication Technology",
  ARTS = "Arts",
  SCIENCES = "Science",
  LAW = "Law",
  BUSINESS = "Business",
  ENGINEERING = "Engineering",
  HEALTH_AND_BEHAVIOR = "Health and Behavior",
  CMS = "Applied and Natural Science"
}

// USER PERMISSIONS
enum UserPermissions {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  UPDATE = "update"
}

// USER STORAGE SPACE
enum UserFileStorageSpace {
  BASIC_GB_10 = "10 GB",
  STANDARD_GB_20 = "20 GB",
  PREMIUM_GB_50 = "50 GB",
}

// USER ADMISSION TYPE 
enum UserAdmissionType {
  REGULAR = "RG", // Regular
  INTERNSHIP = "INT", // Interfaceship
  PART_TIME = "PT", // Part Time
  DISTANCE_LEARNING = "DL", // Distances Learning
  OTHER = "Other",
  MBA = "MBA",
  BACHELOR_DEGREE = "BSc",
  MASTER = "MSc",
  DOCTORATE = "PhD",
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
  department: string;
  faculty: string;
  permissions: string[];
  matric_number: string;
  storage_space: string;
  admissionType: string;
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
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      // set: encryptData
    },
    matric_number: {
      type: String,
      unique: true,
      default: function (this: IUser) {
        return `IAUE/${new Date().getFullYear()}/${this.admissionType}/${Math.floor(1000 + Math.random() * 9000)}`;
      },
      // set: encryptData
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
    role: { type: String, ref: "Role", default: UserRole.STUDENT, required: true },
    department: {
      type: String,
      enum: Object.values(UserDepartment),
      default: UserDepartment.COMPUTER_SCIENCE
    },
    faculty: {
      type: String,
      enum: Object.values(UserFaculty),
      default: UserFaculty.ICT
    },
    admissionType: {
      type: String,
      enum: Object.values(UserAdmissionType),
      default: UserAdmissionType.REGULAR
    },
    permissions: {
      type: [String],
      enum: Object.values(UserPermissions), 
      default: [UserPermissions.READ],
    },
    storage_space: {
      type: String,
      enum: Object.values(UserFileStorageSpace),
      default: UserFileStorageSpace.BASIC_GB_10
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
