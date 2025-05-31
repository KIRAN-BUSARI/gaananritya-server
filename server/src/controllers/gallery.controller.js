import { Gallery } from "../models/gallery.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const uploadImage = asyncHandler(async (req, res) => {
  const { category } = req.body;

  if (!category || !category.trim()) {
    throw new ApiError(400, "Category is required");
  }

  // Check if files exist
  if (!req.files || !req.files.length) {
    throw new ApiError(400, "Image files are required");
  }

  // Process all uploads in parallel for better performance
  const uploadPromises = req.files.map(async (file) => {
    try {
      // Upload the image to Cloudinary
      const cloudinaryResponse = await uploadOnCloudinary(file.path);

      // Make sure we got a response from Cloudinary
      if (!cloudinaryResponse?.url) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
      }

      // Create a new gallery entry in the database
      const galleryEntry = await Gallery.create({
        image: cloudinaryResponse.url,
        category: category.toLowerCase().trim(),
      });

      return {
        id: galleryEntry._id,
        url: cloudinaryResponse.url,
        category: galleryEntry.category
      };
    } catch (error) {
      console.error(`Error uploading image: ${file.path}`, error);
      throw error; // Let the Promise.all catch this
    }
  });

  try {
    // Wait for all uploads to complete
    const uploadedImages = await Promise.all(uploadPromises);

    return res.status(201).json(
      new ApiResponse(
        201,
        uploadedImages,
        uploadedImages.length > 1
          ? `${uploadedImages.length} images uploaded successfully`
          : "Image uploaded successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "One or more images failed to upload");
  }
});

const getImgs = asyncHandler(async (req, res) => {
  try {
    // Use projection to select only needed fields and lean() for better performance
    const gallery = await Gallery.find()
      .select('image category _id')
      .sort({ createdAt: -1 })
      .lean();

    res.json(new ApiResponse(200, gallery, "All Gallery Images"))
  } catch (error) {
    console.error("Error getting images:", error);
    throw new ApiError(500, "Error getting images")
  }
});

const deleteImg = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);

  // Use findByIdAndDelete directly without separate find query
  const deletedImage = await Gallery.findByIdAndDelete(id);

  if (!deletedImage) {
    throw new ApiError(404, "Image not found")
  }

  res.json(new ApiResponse(200, null, "Image deleted successfully"))
});

const getImgsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  // Use lean for better performance when we don't need Mongoose methods
  const gallery = await Gallery.find({ category })
    .select('image category _id')
    .sort({ createdAt: -1 })
    .lean();

  if (!gallery || gallery.length === 0) {
    return res.json(new ApiResponse(200, [], "No images found for this category"))
  }

  res.json(new ApiResponse(200, gallery, "All Gallery Images"))
});

export { uploadImage, getImgs, deleteImg, getImgsByCategory };