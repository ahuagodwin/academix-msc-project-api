import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import dotenv from "dotenv";
import path from "path";
import { FIREBASE_SERVICE_ACCOUNT, FIREBASE_STORAGE_BUCKET } from "../config/env";


dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT as string);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage().bucket();

/**
 * Uploads a file to Firebase Storage.
 * @param {Express.Multer.File} file - The file to upload.
 * @returns {Promise<string>} - The download URL.
 */
export const uploadFileToFirebase = async (file: Express.Multer.File): Promise<string> => {
  try {
    const filePath = path.join(__dirname, "../uploads", file.filename);
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
  } catch (error) {
    console.error("Firebase Upload Error:", error);
    throw new Error("Error uploading file to Firebase Storage");
  }
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} fileUrl - The file URL to delete.
 * @returns {Promise<void>}
 */
export const deleteFileFromFirebase = async (fileUrl: string): Promise<void> => {
  try {
    const filePath = fileUrl.split("/o/")[1]?.split("?")[0]?.replace("%2F", "/");
    if (filePath) {
      await bucket.file(filePath).delete();
      console.log(`File deleted from Firebase: ${fileUrl}`);
    }
  } catch (error) {
    console.error("Firebase Deletion Error:", error);
    throw new Error("Error deleting file from Firebase Storage");
  }
};
