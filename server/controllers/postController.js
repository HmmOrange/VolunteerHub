import Post from "../models/Post.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Comment from "../models/Comment.js"; 

// ... (Hàm getPostsByEvent của bạn) ...
export const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const posts = await Post.find({ eventId: eventId })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return {
          ...post.toObject(),
          commentCount: commentCount, 
        };
      })
    );

    res.status(200).json(postsWithCommentCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ... (Hàm createPost của bạn) ...
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, isAnonymous, username, eventId } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const newPost = new Post({
      content,
      imageUrl,
      isAnonymous,
      eventId,
      createdBy: user._id,
      likes: [],
    });

    await newPost.save();
    
    const populatedPost = await newPost.populate("createdBy", "username");
    res.status(201).json({ ...populatedPost.toObject(), commentCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === THÊM HÀM MỚI NÀY VÀO CUỐI FILE ===
// POST /api/posts/:postId/like
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body; // Lấy username từ người gửi request

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    const userId = user._id;

    // Kiểm tra xem người dùng đã like bài đăng này chưa
    // (Dùng .toString() để so sánh ObjectId)
    const isLiked = post.likes.find((id) => id.toString() === userId.toString());

    if (isLiked) {
      // Nếu đã like -> unlike (xóa ID khỏi mảng)
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Nếu chưa like -> like (thêm ID vào mảng)
      post.likes.push(userId);
    }

    await post.save();

    // Trả về mảng likes mới (chỉ chứa ID)
    res.status(200).json(post.likes); 

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/:postId/likes
export const getLikesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
                           .populate("likes", "username"); // Populate mảng 'likes' và chỉ lấy 'username'

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post.likes); 

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};