import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

// --- IMPORTS ROUTES ---
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import postRoutes from "./routes/postRoutes.js"; 
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import captchaRoutes from "./routes/captchaRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"; 

/**
 * Entry point cho server Express
 * - Thiết lập middleware, kết nối DB, đăng ký các route và khởi động server.
 */
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Giữ limit cao cho các request JSON lớn
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Lấy __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static folder uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect DB
connectDB();

// --- ĐĂNG KÝ ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes); 
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/captcha", captchaRoutes);
app.use("/api/notifications", notificationRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));