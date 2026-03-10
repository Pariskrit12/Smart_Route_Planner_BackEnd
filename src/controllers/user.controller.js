import { User } from "../models/user_model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const generateAcessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while generating access and refresh token",
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "Fill all the required field");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(400, "Email Already Registered");
  }
  if (!passwordRegex.test(password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long, include 1 uppercase letter, 1 number, and 1 special character",
    );
  }

  const registeredUser = await User.create({
    username: username,
    email: email,
    password: password,
  });

  const createdUser = await User.findById(registeredUser._id).select(
    "-password",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (!userExists) {
    throw new ApiError(400, "User with email doesnot exist");
  }
  const isPasswordValid = await userExists.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Password not matched");
  }

  const { accessToken, refreshToken } = await generateAcessAndRefreshToken(
    userExists._id,
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  const loggedInUser = await User.findById(userExists._id).select(
    "-password -refreshToken",
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "Logged In user successfully",
      ),
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { returnDocument: "after" },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out Successfully"));
});

const userProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile fetched successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized access");
  }

  const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  if (!decode) {
    throw new ApiError(400, "Invalid token");
  }

  const user = await User.findById(decode._id);

  if (user?.refreshToken !== token) {
    throw new ApiError(401, "Refresh token is expired");
  }
  const { accessToken, refreshToken } = await generateAcessAndRefreshToken(
    user._id,
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Successfull refreshed access and refresh token"),
    );
});

//updateUserProfile
//changePassword
export { userRegister, userLogin, userLogout, userProfile, refreshToken };
