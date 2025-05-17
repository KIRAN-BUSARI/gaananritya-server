import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    }

    // Decode token first to avoid unnecessary DB query if token is invalid
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired access token");
    }

    // Only query database if token verification is successful
    // Use lean() for better performance and specific field projection
    const user = await User.findById(decodedToken?._id)
      .select("-password -refreshToken")
      .lean();

    if (!user) {
      throw new ApiError(401, "Invalid Access Token: User not found")
    }

    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})

export const allowedRoles = (...roles) => {
  return (req, _, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized request");
    }

    const userRole = req.user.role;
    const isAllowed = roles.includes(userRole);

    if (!isAllowed) {
      throw new ApiError(403, "You are not allowed to access this resource");
    }

    next();
  };
};