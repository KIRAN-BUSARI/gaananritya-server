import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const domain = process.env.NODE_ENV === "production"
  ? new URL(process.env.CORS_ORIGIN).hostname
  : 'localhost';

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
  domain
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (
    [email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  // Use lean() for faster query when we only need to check existence
  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    throw new ApiError(400, "User with Email already exists");
  }

  // Create user and use select() directly to omit password and refreshToken
  // This eliminates the need for a separate query
  const createdUser = await User.create({
    username,
    email,
    password
  }).then(user => {
    // Convert document to plain object and remove sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    return userObj;
  });

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  )
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  console.log(email, process.env.ADMIN_EMAIL, password, process.env.ADMIN_PASSWORD);

  if ((email !== process.env.ADMIN_EMAIL) || (password !== process.env.ADMIN_PASSWORD)) {
    throw new ApiError(500, "Please provide a correct ADMIN credentials")
  };

  // Use a single query to get user data with password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "User Not Found! with this Email");
  }

  const isCorrectPassword = await user.isPasswordCorrect(password)

  if (!isCorrectPassword) {
    throw new ApiError(401, "Invalid Password");
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Update user with refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove sensitive data before sending response
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userObj, accessToken, refreshToken
        },
        "User logged In Successfully"
      )
    )
});


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req?.user,
      "User fetched successfully"
    ))
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
});


const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUsers,
  changeCurrentPassword
};