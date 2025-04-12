import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_FOLDER, CLOUDINARY_TYPE } from "../config/env";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

// function to upload file
export const uploadFileToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      type: CLOUDINARY_TYPE,
      folder: CLOUDINARY_FOLDER, 
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Error uploading file to Cloudinary");
  }
};
 
// function to delete file
export const deleteFileFromCloudinary = async (fileUrl: string): Promise<void> => {
  try {
    const publicId = fileUrl.split("/").slice(-2, -1).join(""); 
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`File deleted from Cloudinary: ${fileUrl}`);
    } else {
      throw new Error("Failed to extract public ID for deletion");
    }
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw new Error("Error deleting file from Cloudinary");
  }
};

export { cloudinary };
