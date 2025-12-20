import express from "express";
import { getCommentsByPost, createComment, getCommentById } from "../controllers/commentController.js";

const router = express.Router();

router.get("/post/:postId", getCommentsByPost);
router.post("/create", createComment);
router.get("/:commentId", getCommentById);

export default router;