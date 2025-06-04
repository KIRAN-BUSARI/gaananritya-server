import { Gallery } from "../models/gallery.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadImage = asyncHandler(async (req, res) => {
  const { category } = req.body;

  if (!category || !category.trim()) {
    throw new ApiError(400, "Category is required");
  }

  if (!req.files || !req.files.length) {
    throw new ApiError(400, "Image files are required");
  }

  const uploadPromises = req.files.map(async (file) => {
    try {
      const cloudinaryResponse = await uploadOnCloudinary(file.path);

      if (!cloudinaryResponse || (!cloudinaryResponse.url && !cloudinaryResponse.secure_url)) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
      }

      const imageUrl = cloudinaryResponse.secure_url || cloudinaryResponse.url;

      const galleryEntry = await Gallery.create({
        image: imageUrl,
        category: category.toLowerCase().trim(),
      });

      return {
        id: galleryEntry._id,
        url: imageUrl,
        category: galleryEntry.category
      };
    } catch (error) {
      console.error(`Error uploading image: ${file.path}`, error);
      throw error;
    }
  });

  try {
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
    console.error("Error in uploadImage:", error);
    throw new ApiError(500, "One or more images failed to upload");
  }
});

const getImgs = asyncHandler(async (req, res) => {
  try {
    const gallery = await Gallery.find()
      .select('image category _id')
      .sort({ createdAt: -1 })
      .lean();

    res.json(new ApiResponse(200, gallery, "All gallery images retrieved successfully"));
  } catch (error) {
    console.error("Error getting images:", error);
    throw new ApiError(500, "Error retrieving gallery images");
  }
});

const deleteImg = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Image ID is required");
  }

  const deletedImage = await Gallery.findByIdAndDelete(id);

  if (!deletedImage) {
    throw new ApiError(404, "Image not found");
  }

  res.json(new ApiResponse(200, null, "Image deleted successfully"));
});

const getImgsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  if (!category || !category.trim()) {
    throw new ApiError(400, "Category parameter is required");
  }

  const gallery = await Gallery.find({ category: category.toLowerCase().trim() })
    .select('image category _id')
    .sort({ createdAt: -1 })
    .lean();

  if (!gallery || gallery.length === 0) {
    return res.json(new ApiResponse(200, [], "No images found for this category"));
  }

  res.json(new ApiResponse(200, gallery, "Gallery images retrieved successfully"));
});

export { uploadImage, getImgs, deleteImg, getImgsByCategory };