"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileFromStorage = exports.uploadFileToStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const renameAsync = (0, util_1.promisify)(fs_1.default.rename);
const unlinkAsync = (0, util_1.promisify)(fs_1.default.unlink);
const UPLOADS_DIR = path_1.default.join(__dirname, "../uploads");
// Ensure uploads directory exists
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
/**
 * Uploads a file and moves it to the uploads directory.
 * Returns only the relative path to prevent exposing server structure.
 */
const uploadFileToStorage = async (file) => {
    try {
        const relativePath = path_1.default.join("uploads", file.filename); // Store only the relative path
        const newFilePath = path_1.default.join(UPLOADS_DIR, file.filename);
        // Move file from temp storage to the uploads folder
        await renameAsync(file.path, newFilePath);
        return relativePath; // Return relative path instead of absolute
    }
    catch (error) {
        console.error("File Upload Error:", error);
        throw new Error("Error uploading file");
    }
};
exports.uploadFileToStorage = uploadFileToStorage;
/**
 * Deletes a file from storage.
 */
const deleteFileFromStorage = async (storagePath) => {
    try {
        const absolutePath = path_1.default.join(__dirname, "..", storagePath); // Resolve relative path
        if (fs_1.default.existsSync(absolutePath)) {
            await unlinkAsync(absolutePath);
            console.log(`File deleted: ${absolutePath}`);
        }
    }
    catch (error) {
        console.error("File Deletion Error:", error);
        throw new Error("Error deleting file");
    }
};
exports.deleteFileFromStorage = deleteFileFromStorage;
