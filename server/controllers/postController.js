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
      imageUrl: imageUrl,
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

// ... (Hàm likePost của bạn) ...
export const likePost = async (req, res) => { /* ... */ };

// ... (Hàm getLikesByPost của bạn) ...
export const getLikesByPost = async (req, res) => { /* ... */ };

// ... (Hàm uploadImage của bạn) ...
export const uploadImage = async (req, res) => { /* ... */ };


// === THÊM HÀM MỚI (UPDATE) ===
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username, content } = req.body; // Chỉ cho phép sửa nội dung

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Kiểm tra quyền: Hoặc là manager, hoặc là người tạo
    const isOwner = post.createdBy.toString() === user._id.toString();
    const isManager = user.role === 'manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài đăng này" });
    }

    post.content = content;
    await post.save();
    
    // Trả về bài đăng đã cập nhật (đã populate)
    const updatedPost = await Post.findById(postId).populate("createdBy", "username");
    const commentCount = await Comment.countDocuments({ postId: post._id });
    
    res.status(200).json({ ...updatedPost.toObject(), commentCount: commentCount });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === THÊM HÀM MỚI (DELETE) ===
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Kiểm tra quyền: Hoặc là manager, hoặc là người tạo
    const isOwner = post.createdBy.toString() === user._id.toString();
    const isManager = user.role === 'manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    // Xóa tất cả bình luận liên quan (Tùy chọn nhưng nên làm)
    await Comment.deleteMany({ postId: postId });
    
    // Xóa bài đăng
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};