import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  })













/*
import express from "express";
const app = express();

(async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error", ()=>{
        console.log("Error connecting to the database",error);
        throw error;
      })

      app.listen(process.env.PORT, () =>{
        console.log(`App is listening on port ${process.env.PORT}`);
      })

    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
})
    */