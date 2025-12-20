import express from "express";
import multer from "multer"; 
import path from "path"; 

import { 
  getPostsByEvent, 
  createPost,
  likePost,
  getLikesByPost,
  uploadImage,
  updatePost, // 1. Import hàm mới
  deletePost,
  getPostById  // 2. Import hàm mới
} from "../controllers/postController.js";

const router = express.Router();

// ... (Cấu hình Multer 'storage' và 'upload' của bạn) ...
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes
router.post("/upload", upload.single('image'), uploadImage);
router.get("/event/:eventId", getPostsByEvent);
router.post("/create", createPost);
router.post("/:postId/like", likePost);
router.get("/:postId/likes", getLikesByPost);
router.put("/:postId", updatePost); // Cập nhật bài đăng
router.delete("/:postId", deletePost); // Xóa bài đăng
router.get("/:postId", getPostById);

export default router;