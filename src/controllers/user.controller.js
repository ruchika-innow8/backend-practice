import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokenss = asyncHandler(async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false })
        
       return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
})


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

const loginUser = asyncHandler(async(req, res)=>{
 
// req body-> data
// username or email
// find the user
// password check
// access and refresh token
// send cookies

const {email, username, password} = req.body
console.log("email", email)

if(!(username || email)){
    throw new ApiError(400, "Username or email is required for login");
}

const user = await User.findOne({$or: [{email}, {username}]})
    if(!user) {
        throw new ApiError(404, "User does not exist ");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

  const {accessToken, refreshToken} = await  generateAccessAndRefreshTokes(user._id)

  const loggedInUser  = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    options: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(
    200,
    {
      user: loggedInUser, accessToken,
      refreshToken
    }, 
    "User logged in successfully"
  )
)
})

const logOutUser = asyncHandler(async(req, res)=>{
await User.findByIdAndUpdatde(
  req.user._id,
  {
    $set: {
      refreshToken: undefined
    }
  },
  {
    new: true
  }
)

const options = {
  options: true,
  secure: true
}
 
return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User Logged Out"))

})

const refreshAccessToken = asyncHandler(async(req, res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }
})

try {
  const decodedToken = jwt.verify(
    incomingRefreshToken, 
    process.env.REFRESH_TOKEN_SECRET
  );
  
  const user = await User.findById(decodedToken?._id)
  
  if (!user){
    throw new ApiError(401, "Invalid refresh token")
  }
  
  if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401, "Refresh token is expired or used")
  }
  
  const options = {
    httpOnly: true,
    secure: true
  }
  
  const {accessToken, newRefreshToken} = await  generateAccessAndRefreshTokenss(user._id)
  return res.status(200)
  .clearCookie("accessToken", accessToken, options)
  .clearCookie("refreshToken", newRefreshToken, options)
  .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed"))
  
} catch (error) {
  throw new ApiError(401, error?.message || "Invalid Refresh token")
}

export { registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
 };
