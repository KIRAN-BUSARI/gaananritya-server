import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (file) => {
  try {
    if (!file || !file.buffer) return null;

    // Convert buffer to base64 string for Cloudinary upload
    const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(fileStr, {
      resource_type: "auto",
      filename_override: file.originalname
    });

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloudinary };
