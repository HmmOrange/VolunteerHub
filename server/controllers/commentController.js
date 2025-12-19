import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

// Lấy tất cả bình luận của một bài đăng
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId: postId })
      // --- SỬA Ở ĐÂY ---
      // Thêm 'avatar' và 'role' để frontend hiển thị ảnh và màu nền đúng
      .populate("createdBy", "username avatar role") 
      .sort({ createdAt: "asc" }); 

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
    
    // --- SỬA Ở ĐÂY ---
    // Populate đầy đủ thông tin để trả về ngay cho frontend update UI
    const populatedComment = await newComment.populate("createdBy", "username avatar role");

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};