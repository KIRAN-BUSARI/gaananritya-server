import { Gallery } from "../models/gallery.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { cleanupTempFiles } from "../middlewares/multer.middleware.js";

const uploadImg = asyncHandler(async (req, res) => {
  const { category } = req.body;
  console.log(category);

  if (!category) {
    throw new ApiError(400, "Please provide a category")
  }
  if (category.length < 3) {
    throw new ApiError(400, "Category name should be at least 3 characters long")
  }
  if (category.length > 20) {
    throw new ApiError(400, "Category name should be at most 20 characters long")
  }
  const localImgs = req.files;
  console.log(localImgs);

  if (!req.files) {
    throw new ApiError(400, "Please upload images")
  }
  if (req.files.length > 20) {
    throw new ApiError(400, "You can only upload up to 20 images")
  }
  if (req.files.length < 1) {
    throw new ApiError(400, "Please upload at least one image")
  }

  if (!localImgs || localImgs.length === 0) {
    throw new ApiError(400, "Please upload at least one image")
  }

  const uploadPromises = localImgs.map(file => uploadOnCloudinary(file.path));
  cleanupTempFiles(localImgs);
  const cloudinaryResults = await Promise.all(uploadPromises);

  const galleryDocs = await Gallery.insertMany(
    cloudinaryResults.map(result => ({
      image: result.secure_url,
      category: category,
    }))
  );

  console.log(galleryDocs);

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

export { uploadImg, getImgs, deleteImg, getImgsByCategory };