import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import postRoutes from "./routes/postRoutes.js"; 
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// === THÊM 2 DÒNG NÀY ===
import path from "path";
import { fileURLToPath } from "url";
// =========================

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Lấy __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Biến thư mục 'uploads' thành thư mục tĩnh
// Giờ đây, ảnh có thể được truy cập qua: http://localhost:5000/uploads/ten_anh.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// =========================

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes); 
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));