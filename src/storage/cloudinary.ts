import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_, file) => ({
      folder: "uploads", // Cloudinary folder name
      resource_type: "auto", // Allows image, video, and documents
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Set file name without extension
    }),
  });
  

// Function to upload file
export const uploadFileToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Error uploading file to Cloudinary");
  }
};

// Function to delete file
export const deleteFileFromCloudinary = async (fileUrl: string): Promise<void> => {
  try {
    const publicId = fileUrl.split("/").pop()?.split(".")[0]; // Extract public ID
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`File deleted from Cloudinary: ${fileUrl}`);
    }
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw new Error("Error deleting file from Cloudinary");
  }
};

export { cloudinary, storage };
