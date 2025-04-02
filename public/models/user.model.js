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
exports.User = void 0;
const types_1 = require("../types/types");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importStar(require("mongoose"));
// Defining the schema
const userSchema = new mongoose_1.Schema({
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
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, unique: true, },
    password: { type: String, required: true, minlength: 6 },
    position: { type: String, required: false, trim: true },
    user_type: { type: String, enum: Object.values(types_1.UserType), required: true },
    faculty: { type: String, required: function () {
            return this.user_type === types_1.UserType.STUDENT || this.user_type === types_1.UserType.TEACHER;
        }, trim: true },
    department: { type: String, required: function () {
            return this.user_type === types_1.UserType.STUDENT || this.user_type === types_1.UserType.TEACHER;
        }, trim: true },
    school: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "School", required: function () {
            return this.user_type === types_1.UserType.STUDENT || this.user_type === types_1.UserType.TEACHER;
        } },
    roles: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Role" }],
    wallet: { type: mongoose_1.Schema.Types.ObjectId, ref: "Wallet" },
    storage_spaces: { type: mongoose_1.Schema.Types.ObjectId, ref: "Storage" },
    assignedFaculty: [{ type: mongoose_1.default.Schema.Types.ObjectId, required: false, trim: true }],
    assignedDepartment: [{ type: mongoose_1.default.Schema.Types.ObjectId, required: false, trim: true }],
    assignedCourses: [{ type: mongoose_1.default.Schema.Types.ObjectId, required: false, trim: true }],
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
}, { timestamps: true });
// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 12);
    this.passwordChangedAt = new Date();
    next();
});
// Compare entered password with the hashed password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt_1.default.compare(enteredPassword, this.password);
};
// Create a password reset token and set expiration date
userSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    return resetToken;
};
// Check if password reset token has expired
userSchema.methods.isPasswordResetTokenExpired = function () {
    return Date.now() > this.passwordResetExpires?.getTime();
};
userSchema.pre("save", function (next) {
    if (!this.userId) {
        this.userId = this._id;
    }
    next();
});
// Creating the model
const User = (0, mongoose_1.model)("User", userSchema);
exports.User = User;
