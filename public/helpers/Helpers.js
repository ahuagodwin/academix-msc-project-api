"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateResults = exports.buildQuery = exports.paginate = exports.formatStorageSize = exports.permissions = exports.generateToken = exports.generateRefreshToken = exports.generateOTP = exports.generateRandomPassword = exports.generateInitials = exports.monthNames = exports.hashedToken = exports.getEnvVariable = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ms_1 = __importDefault(require("ms"));
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("../config/env");
const getEnvVariable = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};
exports.getEnvVariable = getEnvVariable;
const hashedToken = (key) => {
    const hmac = crypto_1.default.createHash('sha256');
    hmac.update(key);
    return hmac.digest('hex') === key;
};
exports.hashedToken = hashedToken;
// Array for mapping month numbers to their string representations
exports.monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
// Function to generate initials from departmentName
const generateInitials = (name) => {
    return name
        .split(" ") // Split by spaces
        .map(word => word[0]?.toUpperCase()) // Get first letter and capitalize
        .join(""); // Join initials together
};
exports.generateInitials = generateInitials;
// Function to generate a random password
const generateRandomPassword = (length = 10) => {
    return crypto_1.default.randomBytes(length).toString("hex").slice(0, length);
};
exports.generateRandomPassword = generateRandomPassword;
// Utility to generate a 6-digit OTP
const generateOTP = (length = 6) => {
    const min = Math.pow(10, length - 1); // Minimum value based on OTP length
    const max = Math.pow(10, length) - 1; // Maximum value based on OTP length
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    // Ensure OTP is always the correct length, even with leading zeros
    return otp.toString().padStart(length, '0');
};
exports.generateOTP = generateOTP;
const generateRefreshToken = (id) => {
    const secret = (0, exports.getEnvVariable)("JWT_SECRET_KEY");
    if (typeof secret !== 'string') {
        throw new Error("JWT_SECRET_KEY must be a valid string.");
    }
    // Ensure expiresIn is a valid string or number
    const expiresIn = env_1.JWT_REFRESH_EXPIRATION || "10d";
    // Parse expiresIn using ms library (converts to number of milliseconds)
    const parsedExpiresIn = (0, ms_1.default)(expiresIn);
    if (typeof parsedExpiresIn !== 'number') {
        throw new Error(`Invalid duration string for JWT_ACCESS_EXPIRATION: ${expiresIn}`);
    }
    // Sign the JWT token with parsedExpiresIn as number
    return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const generateToken = (id) => {
    const secret = (0, exports.getEnvVariable)("JWT_SECRET_KEY");
    if (typeof secret !== 'string') {
        throw new Error("must be a valid string.");
    }
    // Ensure expiresIn is a valid string or number
    const expiresIn = env_1.JWT_REFRESH_EXPIRATION || "10d"; // Default fallback
    // Parse expiresIn using ms library (converts to number of milliseconds)
    const parsedExpiresIn = (0, ms_1.default)(expiresIn);
    if (typeof parsedExpiresIn !== 'number') {
        throw new Error(`Invalid duration: ${expiresIn}`);
    }
    // Sign the JWT token with parsedExpiresIn as number
    return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
};
exports.generateToken = generateToken;
// Example Usage:
exports.permissions = {
    owner: ["create_role", "read_role", "update_role", "delete_role"],
    teacher: ["read_student"],
    student: ["read_dashboard"],
};
const formatStorageSize = (size) => {
    if (size >= 1e12)
        return `${(size / 1e12).toFixed(2)} TB`;
    if (size >= 1e9)
        return `${(size / 1e9).toFixed(2)} GB`;
    if (size >= 1e6)
        return `${(size / 1e6).toFixed(2)} MB`;
    if (size >= 1e3)
        return `${(size / 1e3).toFixed(2)} KB`;
    return `${size} Bytes`;
};
exports.formatStorageSize = formatStorageSize;
// for page and limit
const paginate = (page, limit) => {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    return { pageNumber, limitNumber, skip };
};
exports.paginate = paginate;
// for search or filter query
const buildQuery = (filters) => {
    const query = {};
    // Iterate over the provided filters and add them to the query
    Object.keys(filters).forEach((key) => {
        if (filters[key])
            query[key] = filters[key];
    });
    return query;
};
exports.buildQuery = buildQuery;
// for pagination control 
const paginateResults = (totalRecords, page, limit) => {
    const totalPages = Math.ceil(totalRecords / limit);
    return {
        totalRecords,
        currentPage: page,
        totalPages,
        nextPage: page < totalPages ? page + 1 : null,
    };
};
exports.paginateResults = paginateResults;
