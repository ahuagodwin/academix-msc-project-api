import { Document } from "mongoose";
import "express";

declare global {
  namespace NodeJS {
      interface ProcessEnv {
          JWT_SECRET_KEY: string;
      }
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
    }
  }
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


// Define the interface for a Wallet document
