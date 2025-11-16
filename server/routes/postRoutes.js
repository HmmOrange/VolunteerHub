import express from "express";
import { 
  getPostsByEvent, 
  createPost,
  likePost,
  getLikesByPost
} from "../controllers/postController.js";

const router = express.Router();

// GET /api/posts/event/:eventId
router.get("/event/:eventId", getPostsByEvent);

// POST /api/posts/create
router.post("/create", createPost);

// 2. Thêm route mới (phải là POST hoặc PUT/PATCH)
// POST /api/posts/69194a63.../like
router.post("/:postId/like", likePost);

// GET /api/posts/:postId/likes
router.get("/:postId/likes", getLikesByPost);

export default router;