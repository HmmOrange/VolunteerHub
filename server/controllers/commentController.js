import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { createNotificationInternal } from "../controllers/notificationController.js";

// Lấy tất cả bình luận của một bài đăng
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

// Tạo một bình luận mới
export const createComment = async (req, res) => {
  try {
    const { content, username, postId } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Lấy thông tin bài viết để kiểm tra chủ sở hữu
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    const newComment = new Comment({
      content,
      postId,
      createdBy: user._id,
    });

    await newComment.save();
    
    const populatedComment = await newComment.populate("createdBy", "username avatar role");

    // --- THÔNG BÁO: User comment vào bài viết ---
    if (post.createdBy.toString() !== user._id.toString()) {
      await createNotificationInternal({
        recipientId: post.createdBy,
        type: "POST_COMMENTED",
        message: `${user.username} đã bình luận về bài viết của bạn: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
        
        // [SỬA] Trỏ thẳng về Event
        relatedId: post.eventId, 
        relatedModel: "Event"   
      });
    }

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [GIỮ LẠI] Lấy chi tiết 1 Comment
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