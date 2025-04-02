"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileFromFirebase = exports.uploadFileToFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const storage_1 = require("firebase-admin/storage");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
dotenv_1.default.config();
// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(env_1.FIREBASE_SERVICE_ACCOUNT);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    storageBucket: env_1.FIREBASE_STORAGE_BUCKET,
});
const bucket = (0, storage_1.getStorage)().bucket();
/**
 * Uploads a file to Firebase Storage.
 * @param {Express.Multer.File} file - The file to upload.
 * @returns {Promise<string>} - The download URL.
 */
const uploadFileToFirebase = async (file) => {
    try {
        const filePath = path_1.default.join(__dirname, "../uploads", file.filename);
        await bucket.upload(filePath, {
            destination: `uploads/${file.filename}`,
            metadata: { contentType: file.mimetype },
        });
        // Get public URL
        const fileRef = bucket.file(`uploads/${file.filename}`);
        const [url] = await fileRef.getSignedUrl({
            action: "read",
            expires: "01-01-2030",
        });
        return url;
    }
    catch (error) {
        console.error("Firebase Upload Error:", error);
        throw new Error("Error uploading file to Firebase Storage");
    }
};
exports.uploadFileToFirebase = uploadFileToFirebase;
/**
 * Deletes a file from Firebase Storage.
 * @param {string} fileUrl - The file URL to delete.
 * @returns {Promise<void>}
 */
const deleteFileFromFirebase = async (fileUrl) => {
    try {
        const filePath = fileUrl.split("/o/")[1]?.split("?")[0]?.replace("%2F", "/");
        if (filePath) {
            await bucket.file(filePath).delete();
            console.log(`File deleted from Firebase: ${fileUrl}`);
        }
    }
    catch (error) {
        console.error("Firebase Deletion Error:", error);
        throw new Error("Error deleting file from Firebase Storage");
    }
};
exports.deleteFileFromFirebase = deleteFileFromFirebase;
