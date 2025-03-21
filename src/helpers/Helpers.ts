import crypto from 'crypto';
import { Types } from 'mongoose';
import ms from 'ms';
import * as jwt from "jsonwebtoken"
import { JWT_REFRESH_EXPIRATION } from '../config/env';
import { RolePermissions } from "../types/types";


export const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};


 export const hashedToken = (key: string) => {
    const hmac = crypto.createHash('sha256');
    hmac.update(key);
    return hmac.digest('hex') === key;
 }
 

 // Array for mapping month numbers to their string representations
export const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];



  // Function to generate initials from departmentName
export const generateInitials = (name: string): string => {
  return name
    .split(" ") // Split by spaces
    .map(word => word[0]?.toUpperCase()) // Get first letter and capitalize
    .join(""); // Join initials together
}


// Function to generate a random password
export const generateRandomPassword = (length = 10) => {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
};


// Utility to generate a 6-digit OTP
export const generateOTP = (length: number = 6): string => {
  const min = Math.pow(10, length - 1); // Minimum value based on OTP length
  const max = Math.pow(10, length) - 1; // Maximum value based on OTP length
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Ensure OTP is always the correct length, even with leading zeros
  return otp.toString().padStart(length, '0');
};


export const generateRefreshToken= (id: string | Types.ObjectId) => {
  const secret = getEnvVariable("JWT_SECRET_KEY");

  if (typeof secret !== 'string') {
    throw new Error("JWT_SECRET_KEY must be a valid string.");
  }

  // Ensure expiresIn is a valid string or number
  const expiresIn: any = JWT_REFRESH_EXPIRATION|| "10d"; 

  // Parse expiresIn using ms library (converts to number of milliseconds)
  const parsedExpiresIn = ms(expiresIn);

  if (typeof parsedExpiresIn !== 'number') {
    throw new Error(`Invalid duration string for JWT_ACCESS_EXPIRATION: ${expiresIn}`);
  }

  // Sign the JWT token with parsedExpiresIn as number
  return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
};


export const generateToken = (id: string | Types.ObjectId) => {
  const secret = getEnvVariable("JWT_SECRET_KEY");

  if (typeof secret !== 'string') {
    throw new Error("must be a valid string.");
  }

  // Ensure expiresIn is a valid string or number
  const expiresIn: any = JWT_REFRESH_EXPIRATION || "10d";  // Default fallback

  // Parse expiresIn using ms library (converts to number of milliseconds)
  const parsedExpiresIn = ms(expiresIn);

  if (typeof parsedExpiresIn !== 'number') {
    throw new Error(`Invalid duration: ${expiresIn}`);
  }

  // Sign the JWT token with parsedExpiresIn as number
  return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
};

// Example Usage:
export const permissions: RolePermissions = {
  owner: ["create_role", "read_role", "update_role", "delete_role"],
  teacher: ["read_student"],
  student: ["read_dashboard"],
};



export const formatStorageSize = (size: number) => {
  if (size >= 1e12) return `${(size / 1e12).toFixed(2)} TB`;
  if (size >= 1e9) return `${(size / 1e9).toFixed(2)} GB`;
  if (size >= 1e6) return `${(size / 1e6).toFixed(2)} MB`;
  if (size >= 1e3) return `${(size / 1e3).toFixed(2)} KB`;
  return `${size} Bytes`;
};



// for page and limit
export const paginate = (page: any, limit: any) => {
  const pageNumber = parseInt(page as string, 10) || 1;
  const limitNumber = parseInt(limit as string, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  return { pageNumber, limitNumber, skip };
};


// for search or filter query
export const buildQuery = (filters: any) => {
  const query: any = {};

  // Iterate over the provided filters and add them to the query
  Object.keys(filters).forEach((key) => {
    if (filters[key]) query[key] = filters[key];
  });

  return query;
};


// for pagination control 
export const paginateResults = (totalRecords: number, page: number, limit: number) => {
  const totalPages = Math.ceil(totalRecords / limit);
  return {
    totalRecords,
    currentPage: page,
    totalPages,
    nextPage: page < totalPages ? page + 1 : null,
  };
};
