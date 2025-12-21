import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { createNotificationInternal } from "../controllers/notificationController.js";

/**
 * Get all comments belonging to a specific post.
 * @route GET /api/comments/:postId
 * @access Public
 * @param {Object} req.params
 * @param {string} req.params.postId
 * @returns {Array} List of comments populated with creator info
 */
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId: postId })
      .populate("createdBy", "username avatar role")
      .sort({ createdAt: "asc" });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a new comment for a post and optionally notify the post owner.
 * @route POST /api/comments
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.content
 * @param {string} req.body.username
 * @param {string} req.body.postId
 * @returns {Object} Newly created comment with populated creator info
 */
export const createComment = async (req, res) => {
  try {
    const { content, username, postId } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const newComment = new Comment({
      content,
      postId,
      createdBy: user._id,
    });

    await newComment.save();

    const populatedComment = await newComment.populate(
      "createdBy",
      "username avatar role"
    );

    if (post.createdBy.toString() !== user._id.toString()) {
      await createNotificationInternal({
        recipientId: post.createdBy,
        type: "POST_COMMENTED",
        message: `${user.username} đã bình luận về bài viết của bạn: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
        relatedId: post.eventId,
        relatedModel: "Event",
      });
    }

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get a single comment by its ID.
 * @route GET /api/comments/detail/:commentId
 * @access Public
 * @param {Object} req.params
 * @param {string} req.params.commentId
 * @returns {Object} Comment document
 */
export const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
