import { Blog } from "../models/blog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const validateAndFormatDate = (dateStr) => {
  // Try parsing as YYYY-MM-DD first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try parsing DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  throw new ApiError(400, "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY format");
};

const createBlog = asyncHandler(async (req, res) => {
  try {
    console.log("Blog creation request received:", req.body);
    console.log("Files received:", req.file);

    const { title, date, content, author } = req.body;
    const tags = req.body.tags || req.body["tags[]"] || ['Classical Dance', 'Bharatanatyam'];

    // Validate required fields with more detailed error messages
    const missingFields = [];
    if (!title?.trim()) missingFields.push("title");
    if (!date?.trim()) missingFields.push("date");
    if (!content?.trim()) missingFields.push("content");
    if (!author?.trim()) missingFields.push("author");

    if (missingFields.length > 0) {
      throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate and format the date
    let parsedDate;
    try {
      parsedDate = validateAndFormatDate(date);
    } catch (error) {
      throw new ApiError(400, "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY format");
    }

    const imageLocalPath = req.file?.path;
    console.log("Image local path:", imageLocalPath);

    if (!imageLocalPath) {
      throw new ApiError(400, "Image file is required. Please upload an image.");
    }

    // Upload image to Cloudinary with better error handling
    console.log("Uploading to Cloudinary...");
    let cloudinaryResponse;
    try {
      cloudinaryResponse = await uploadOnCloudinary(imageLocalPath);
      console.log("Cloudinary response:", cloudinaryResponse);

      if (!cloudinaryResponse) {
        throw new Error("Failed to upload image to Cloudinary");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new ApiError(500, `Error uploading image to Cloudinary: ${error.message || "Unknown error"}`);
    }

    console.log("Cloudinary upload successful:", cloudinaryResponse.url);

    // Create blog post with secure URL
    const blogData = {
      title,
      date: parsedDate,
      content,
      author,
      image: cloudinaryResponse.secure_url || cloudinaryResponse.url,
      tags: Array.isArray(tags) ? tags : [tags]
    };

    console.log("Creating blog with data:", blogData);

    const blog = await Blog.create(blogData);

    if (!blog) {
      throw new ApiError(500, "Failed to create blog in database");
    }

    console.log("Blog created successfully:", blog._id);

    return res
      .status(201)
      .json(new ApiResponse(
        201,
        blog,
        "Blog created successfully"
      ));

  } catch (error) {
    console.error("Blog creation error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Error while creating blog");
  }
});

const getBlogs = asyncHandler(async (_, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.json(
      new ApiResponse(200, blogs, "Blogs fetched successfully")
    )
  } catch (error) {
    throw new ApiError(500, "Something went wrong", error)
  }
});

// New endpoint to get all blogs with filtering, pagination and search
const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipDocuments = (pageNumber - 1) * limitNumber;

    // Build the query based on filters
    const query = {};

    // Add tag filter if provided
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total documents matching the query
    const totalDocs = await Blog.countDocuments(query);

    // Fetch the blogs with pagination and sorting
    const blogs = await Blog.find(query)
      .sort({ date: -1 })
      .skip(skipDocuments)
      .limit(limitNumber);

    // Return response with metadata in the correct format
    return res.json({
      statusCode: 200,
      data: blogs,
      message: "Blogs fetched successfully",
      success: true,
      total: totalDocs,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalDocs / limitNumber)
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new ApiError(500, "Error while fetching blogs");
  }
});

// Get a single blog by ID
const getBlogById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching blog by ID:", id);

    const blog = await Blog.findById(id);
    console.log(blog);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    // Return response in the expected format
    return res.json({
      statusCode: 200,
      data: blog,
      message: "Blog fetched successfully",
      success: true
    });
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    if (error.name === 'CastError') {
      throw new ApiError(400, "Invalid blog ID format");
    }
    throw new ApiError(500, "Error while fetching blog");
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, content, author } = req.body;
  const tags = req.body.tags || req.body["tags[]"];
  const imageLocalPath = req.file?.path;

  try {
    // Check if blog exists
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      throw new ApiError(404, "Blog not found");
    }

    // Create updateFields object for provided fields
    const updateFields = {};

    // Only add fields that are actually provided (not undefined or null)
    if (title !== undefined && title !== null) {
      updateFields.title = title.trim();
    }
    if (content !== undefined && content !== null) {
      updateFields.content = content.trim();
    }
    if (author !== undefined && author !== null) {
      updateFields.author = author.trim();
    }
    if (tags !== undefined && tags !== null) {
      updateFields.tags = Array.isArray(tags) ? tags : [tags];
    }

    // Parse and validate date only if provided
    if (date !== undefined && date !== null) {
      try {
        // Validate and format the date
        const parsedDate = validateAndFormatDate(date);
        // Set time to noon to avoid timezone issues
        parsedDate.setUTCHours(12, 0, 0, 0);
        updateFields.date = parsedDate;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(400, "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY format");
      }
    }

    // Handle image upload if provided
    if (imageLocalPath) {
      try {
        const uploadedImage = await uploadOnCloudinary(imageLocalPath);
        if (!uploadedImage?.url) {
          throw new ApiError(500, "Error uploading image to Cloudinary");
        }
        updateFields.image = uploadedImage.secure_url || uploadedImage.url;
      } catch (error) {
        throw new ApiError(500, "Failed to upload image");
      }
    }

    // Proceed with update even if no fields are provided (allowing partial updates)
    const blog = await Blog.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!blog) {
      throw new ApiError(400, "Failed to update blog");
    }

    return res.status(200).json(
      new ApiResponse(200, blog, "Blog updated successfully")
    );

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Error while updating blog");
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      throw new ApiError(404, "Blog not found")
    }
    res.status(200).json(
      new ApiResponse(200, blog, "Blog deleted successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error while deleting blog", error)
  }
});

export { createBlog, getBlogs, updateBlog, deleteBlog, getAllBlogs, getBlogById };