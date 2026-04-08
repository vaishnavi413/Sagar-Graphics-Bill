import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import pdf from "html-pdf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import "./utils/backup.js"; // Initialize backup system and cron jobs


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/invoices", invoiceRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Sagar Graphics Invoice API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Invoice API running on port ${PORT}`);
});
