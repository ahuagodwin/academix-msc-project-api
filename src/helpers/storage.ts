import fs from "fs";
import path from "path";
import { promisify } from "util";

const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);

const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Uploads a file and moves it to the uploads directory.
 * Returns only the relative path to prevent exposing server structure.
 */
export const uploadFileToStorage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const relativePath = path.join("uploads", file.filename); // Store only the relative path
    const newFilePath = path.join(UPLOADS_DIR, file.filename);

    // Move file from temp storage to the uploads folder
    await renameAsync(file.path, newFilePath);

    return relativePath; // Return relative path instead of absolute
  } catch (error) {
    console.error("File Upload Error:", error);
    throw new Error("Error uploading file");
  }
};

/**
 * Deletes a file from storage.
 */
export const deleteFileFromStorage = async (storagePath: string): Promise<void> => {
  try {
    const absolutePath = path.join(__dirname, "..", storagePath); // Resolve relative path
    if (fs.existsSync(absolutePath)) {
      await unlinkAsync(absolutePath);
      console.log(`File deleted: ${absolutePath}`);
    }
  } catch (error) {
    console.error("File Deletion Error:", error);
    throw new Error("Error deleting file");
  }
};
