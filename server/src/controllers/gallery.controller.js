import { Gallery } from "../models/gallery.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const uploadImg = asyncHandler(async (req, res) => {
  const localImgs = req.files;
  if (!req.files) {
    throw new ApiError(400, "Please upload images")
  }
  if (req.files.length > 10) {
    throw new ApiError(400, "You can only upload up to 10 images")
  }
  if (req.files.length < 1) {
    throw new ApiError(400, "Please upload at least one image")
  }

  if (!localImgs || localImgs.length === 0) {
    throw new ApiError(400, "Please upload at least one image")
  }

  const uploadPromises = localImgs.map(file => uploadOnCloudinary(file.path));
  const cloudinaryResults = await Promise.all(uploadPromises);

  const galleryDocs = await Gallery.insertMany(
    cloudinaryResults.map(result => ({
      image: result.secure_url
    }))
  );

  res.json(new ApiResponse(200, "Gallery Images uploaded successfully", galleryDocs))
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
  const gallery = await Gallery.findById(id);
  if (!gallery) {
    throw new ApiError(404, "Image not found")
  }
  await Gallery.findByIdAndDelete(id);
  res.json(new ApiResponse(200, "Image deleted successfully"))
});

export { uploadImg, getImgs, deleteImg }