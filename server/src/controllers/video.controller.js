import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper function to extract YouTube video ID and get thumbnail
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Add a new video to the gallery
const addVideo = asyncHandler(async (req, res) => {
  const { videoUrl, title, category = "videos" } = req.body;

  if (!videoUrl) {
    throw new ApiError(400, "Please provide a video URL");
  }

  // Validate YouTube URL
  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new ApiError(400, "Invalid YouTube URL. Please enter a valid YouTube video URL.");
  }

  // Generate thumbnail URL from YouTube video ID
  const thumbnailUrl = getYouTubeThumbnail(videoId);

  // Create new video document
  const video = await Video.create({
    videoUrl,
    title: title || "Untitled Video",
    thumbnailUrl,
    category,
  });

  return res.status(201).json(
    new ApiResponse(201, video, "Video added successfully")
  );
});

// Get all videos from the gallery
const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );
});

// Get videos by category
const getVideosByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const videos = await Video.find({ category }).sort({ createdAt: -1 });

  if (!videos.length) {
    return res.status(200).json(
      new ApiResponse(200, [], "No videos found for this category")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );
});

// Delete a video from the gallery
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, "Video deleted successfully")
  );
});

export { addVideo, getVideos, getVideosByCategory, deleteVideo };