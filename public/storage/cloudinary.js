"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.cloudinary = exports.deleteFileFromCloudinary = exports.uploadFileToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Define storage
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (_, file) => ({
        folder: "uploads", // Cloudinary folder name
        resource_type: "auto", // Allows image, video, and documents
        public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Set file name without extension
    }),
});
exports.storage = storage;
// Function to upload file
const uploadFileToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: "auto",
        });
        return result.secure_url;
    }
    catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Error uploading file to Cloudinary");
    }
};
exports.uploadFileToCloudinary = uploadFileToCloudinary;
// Function to delete file
const deleteFileFromCloudinary = async (fileUrl) => {
    try {
        const publicId = fileUrl.split("/").pop()?.split(".")[0]; // Extract public ID
        if (publicId) {
            await cloudinary_1.v2.uploader.destroy(publicId);
            console.log(`File deleted from Cloudinary: ${fileUrl}`);
        }
    }
    catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new Error("Error deleting file from Cloudinary");
    }
};
exports.deleteFileFromCloudinary = deleteFileFromCloudinary;
