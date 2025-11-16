import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

// Lấy tất cả bình luận của một bài đăng
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId: postId })
      .populate("createdBy", "username") // Lấy 'username'
      .sort({ createdAt: "asc" }); // Sắp xếp cũ nhất lên đầu

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo một bình luận mới
export const createComment = async (req, res) => {
  try {
    const { content, username, postId } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const newComment = new Comment({
      content,
      postId,
      createdBy: user._id,
    });

    await newComment.save();
    
    // Populate createdBy để gửi về client ngay
    const populatedComment = await newComment.populate("createdBy", "username");

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};