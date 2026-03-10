import { User } from "../models/user_model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const generateAcessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

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
export { userRegister, userLogin };
