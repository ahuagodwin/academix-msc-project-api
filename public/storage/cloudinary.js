"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.deleteFileFromCloudinary = exports.uploadFileToCloudinary = void 0;
const env_1 = require("../config/env");
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: env_1.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.CLOUDINARY_API_KEY,
    api_secret: env_1.CLOUDINARY_API_SECRET,
    secure: true
});
// function to upload file
const uploadFileToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: "auto",
            type: env_1.CLOUDINARY_TYPE,
            folder: env_1.CLOUDINARY_FOLDER,
        });
        return result.secure_url;
    }
    catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Error uploading file to Cloudinary");
    }
};
exports.uploadFileToCloudinary = uploadFileToCloudinary;
// function to delete file
const deleteFileFromCloudinary = async (fileUrl) => {
    try {
        const publicId = fileUrl.split("/").slice(-2, -1).join("");
        if (publicId) {
            await cloudinary_1.v2.uploader.destroy(publicId);
            console.log(`File deleted from Cloudinary: ${fileUrl}`);
        }
        else {
            throw new Error("Failed to extract public ID for deletion");
        }
    }
    catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new Error("Error deleting file from Cloudinary");
    }
};
exports.deleteFileFromCloudinary = deleteFileFromCloudinary;
