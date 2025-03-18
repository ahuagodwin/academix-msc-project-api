
import { Request } from "express";
import mongoose, { Document, Types } from "mongoose";

// SCHOOL LIST
export enum Schools {
    IAUE = "Ignatius Ajuru University",
    RSU = "Rivers State University",
    UNIPORT ="University of Port Harcourt",
    UNILAG = "University of Lagos",
    UNIVERSITY_OF_Ibadan = "University of Ibadan",
    UNIUYO = "University of Uyo"
}

export interface ISchool extends Document {
  name: Schools;
  description?: string;
  code?: string;
  userId?: Types.ObjectId | string;
  schoolId?: Types.ObjectId;
  faculties?: {
      name: string;
      facultyId?: Types.ObjectId;
      departments: {
          name: string;
          courses: {
              name: string;
          }[];
      }[];
  }[];
}

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}


export enum UserRoles {
    SUPERADMIN = "Super Admin",
    ADMIN = "Admin",
    STUDENT = "Student",
    TEACHER = "Teacher",
    MANAGER = "Manager",
    DOCUMENT_MANAGER = "Document Manager",
    DOCUMENT_VIEWER = "Document Viewer",
}

export enum UserPermission {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
}

export interface RolePermissions {
  [key: string]: string[]; 
}

export interface IPermission extends Document {
    _id: mongoose.ObjectId
    name: String | UserPermission
    description?: string;
    userId: Types.ObjectId | string;
    roleId: Types.ObjectId | string
}

export interface IUserRoutes {
    routes: IRoute[]
}

export enum Gender {
    MALE = "male",
    FEMALE = "female",
}

export enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DELETED = "deleted",
    BLOCKED = "blocked",
    EXPIRED = "expired",
    SUSPENDED = "suspended", 
}

export enum DocumentStatus {
    UPLOADED = "success",
    UPLOADING = "uploading",
    APPROVED = "approved",
    REJECTED = "rejected",
    PENDING = "pending",
    DELETED = "deleted",
    ERROR = "error",
    VIEWED = "viewed",
    RESUBMIT = "resubmit",
}

export enum DocumentTypes {
    PDF = "pdf",
    EXCEL = "excel",
    PNG = "png",
    JPG = "png",
    DOCX = "docx",
}


// PERMISSIONS AND ROLES
export interface IRole extends Document {
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  roleId?: Types.ObjectId;
  routes: {
      name: string;
      path: string;
  }[];
}

export interface IRoute {
    name: string;
    path: string;
  }


// USER DEPARTMENT
export enum UserDepartment {
    COMPUTER_SCIENCE = "Computer Science",
    ENGLISH = "English",
    MATHS = "Mathematics",
    SCIENCE = "Science",
    SOCIAL_STUDIES = "Social Studies",
  }

  export interface IDepartment extends Document {
    facultyId: Types.ObjectId | string;
    name: UserDepartment;
    code: string;
    userId: Types.ObjectId | string;
    description: string
}

export enum StorageSize {
    IGB = 1 * 1024 * 1024 * 1024, // 1GB
    TWOGB = 2 * 1024 * 1024 * 1024, // 2GB
    FOURGB = 4 * 1024 * 1024 * 1024, // 4GB
    EIGHTGB = 8 * 1024 * 1024 * 1024, // 8GB
    THIRTEENGB = 13 * 1024 * 1024 * 1024, // 13GB
    FIFTEENGB = 15 * 1024 * 1024 * 1024, // 15GB
    TWENTYGB = 20 * 1024 * 1024 * 1024, // 20GB
    TWENTYFIVEGB = 25 * 1024 * 1024 * 1024, // 25GB
    THIRTYGB = 30 * 1024 * 1024 * 1024, // 30GB
    FOURTYGB = 40 * 1024 * 1024 * 1024, // 40GB
    SIXTYGB = 60 * 1024 * 1024 * 1024, // 60GB
    SEVENTYGB = 70 * 1024 * 1024 * 1024, // 70GB
    EIGHTYGB = 80 * 1024 * 1024 * 1024, // 80GB
    TB = 1 * 1024 * 1024 * 1024 * 1024, // 1TB
  }

  export interface IStorage extends Document {
    name: string;
    size: StorageSize;
    status: StorageStatus; // Updated to use the StorageStatus enum
    usedStorage: number;
}

 export  enum StorageStatus {
    active = "active", 
    low = "low", 
    exhausted = "exhausted", 
    renew = "renewed"
  }

  export enum UserType {
    CLIENT = "client",
    TEACHER = "teacher",
    VENDOR = "vendor",
    OWNER = "owner",
  }

  export interface ITransaction {
    type: "deposit" | "withdrawal";
    amount: number;
    timestamp: Date;
    description?: string;
    status: "pending" | "processing" | "completed" | "failed";
  }

  export  interface IWallet extends Document {
    balance: number;
    currency: string;
    userId:  Types.ObjectId
    transactions: ITransaction[];
    deposit(amount: number, description?: string): Promise<void>;
    withdraw(amount: number, description?: string): Promise<boolean>;
    getBalance(): Promise<number>;
    getTransactions(): Promise<ITransaction[]>;
  }

  export interface IUser extends Document {
    _id: Types.ObjectId | string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    position: string
    user_type: UserType | string;
    faculty: Types.ObjectId
    department: Types.ObjectId
    userId?: Types.ObjectId
    school: Types.ObjectId | ISchool;
    storage: Types.ObjectId | IStorage;
    storage_spaces?: Types.ObjectId | IStorage;
    routes: Types.ObjectId[] | IRoute;
    roles: Types.ObjectId[] | IRole;
    assignedFaculty?: Types.ObjectId[] 
    assignedDepartment?: Types.ObjectId[] 
    assignedCourses?: Types.ObjectId[] 
    wallet?: Types.ObjectId | IWallet;
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
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createPasswordResetToken(): Promise<string>;
}


export enum UserFaculty {
    ICT = "Information and Communication Technology",
    ARTS = "Arts",
    SCIENCES = "Science",
    LAW = "Law",
    BUSINESS = "Business",
    ENGINEERING = "Engineering",
    HEALTH_AND_BEHAVIOR = "Health and Behavior",
    CMS = "Applied and Natural Science"
  }


// Define the interface for Faculty
export interface IFaculty extends Document {
    facultyId: Types.ObjectId | string
    name: UserFaculty;
    userId: Types.ObjectId | string;
    description?: string;
    schoolId: Types.ObjectId | string;
  }


  export interface MailData {
    to: string;
    subject: string;
    message?: string;
    html?: string;
}