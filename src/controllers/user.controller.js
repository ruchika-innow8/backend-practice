import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {

    // res.status(200).json({
    //     message: "Hello! Dear user"
    // })

    //get user details from frontend
    // validation- not empty
    //check if user already exists: username and email
    // files check for images and avatar
    //upload them to cloudinary, avatar 
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

  const { fullName, email, username, password } = req.body;
 // console.log("email", email);

  // 1. Basic field validation
  if ([fullName, email, username, password].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // 2. Check for existing user
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }
 // console.log(req.files)

  // 3. File validation
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // 4. Upload to Cloudinary
  const avatar = await uploadonCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadonCloudinary(coverImageLocalPath)
    : null;

  // 5. Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // 6. Select created user (excluding sensitive fields)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 7. Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
