import express from "express";
import { getCommentsByPost, createComment, getCommentById } from "../controllers/commentController.js";

/**
 * Routes cho Comment
 * - Lấy danh sách comment theo post, tạo comment và lấy chi tiết comment
 */
const router = express.Router();

router.get("/post/:postId", getCommentsByPost);
router.post("/create", createComment);
router.get("/:commentId", getCommentById);

export default router;