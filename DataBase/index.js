import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/students", studentRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000, // 10 sec wait karo
    family: 4, // IPv4 force karo
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

app.listen(5000, () => console.log("Server running"));
