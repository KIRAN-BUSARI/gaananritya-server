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

  const uploadPromises = req.files.map(async (file) => {
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
  });

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
});

const getImgs = asyncHandler(async (req, res) => {
  try {
    const gallery = await Gallery.find();
    res.json(new ApiResponse(200, gallery, "All Gallery Images"))
  } catch (error) {
    throw new ApiError(400, "Error getting images")
  }
});

const deleteImg = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const gallery = await Gallery.findById(id);
  if (!gallery) {
    throw new ApiError(404, "Image not found")
  }
  await Gallery.findByIdAndDelete(id);
  res.json(new ApiResponse(200, "Image deleted successfully"))
});

const getImgsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const gallery = await Gallery.find({ category });
  if (!gallery) {
    throw new ApiError(404, "No images found for this category")
  }
  res.json(new ApiResponse(200, gallery, "All Gallery Images"))
}
);

export { uploadImage, getImgs, deleteImg, getImgsByCategory };