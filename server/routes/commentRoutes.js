import express from "express";
import { getCommentsByPost, createComment } from "../controllers/commentController.js";

const router = express.Router();

// GET /api/comments/post/:postId
router.get("/post/:postId", getCommentsByPost);

// POST /api/comments/create
router.post("/create", createComment);

export default router;