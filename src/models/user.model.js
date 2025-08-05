import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bycrypt from 'bcryptjs';
//import { use } from 'express/lib/application';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
     index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
     fullName: {
      type: String,
      required: true,
      trim: true,
     index: true,
    },
    avatar: {
        type: String, //cloudinary url
        required: true,
    },
    coverImage: {
        type: String, //cloudinary url
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    refreshToken: {
        type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (!this.password) {
        this.password = await bycrypt.hash(this.password, 10);
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bycrypt.compare(password, this.password)
}

userSchema.methods.generateAuthToken = function () {
}

userSchema.methods.generateRefreshToken = function () {}

export const User = mongoose.model('User', userSchema);
