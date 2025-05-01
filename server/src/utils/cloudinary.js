import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import fs from "fs";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No file path provided to uploadOnCloudinary");
      return null;
    }

    console.log("Uploading file to Cloudinary:", localFilePath);

    // Check if file exists at the path
    if (!fs.existsSync(localFilePath)) {
      console.error("File not found at path:", localFilePath);
      return null;
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully to Cloudinary:", response.url);

    // File has been uploaded successfully, now remove the file from local storage
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // If an error occurs, remove the locally saved file
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Removed local file after upload failure");
    }

    return null;
  }
};

export { uploadOnCloudinary };
