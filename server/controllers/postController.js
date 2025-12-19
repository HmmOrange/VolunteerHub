import Post from "../models/Post.js";
import User from "../models/User.js";
import Event from "../models/Event.js"; // Cần import Event để kiểm tra chủ sở hữu
import Comment from "../models/Comment.js"; 

// 1. Lấy tất cả bài đăng của sự kiện (GIỮ NGUYÊN)
export const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const posts = await Post.find({ eventId: eventId })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 });

    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return { ...post.toObject(), commentCount: commentCount };
      })
    );
    res.status(200).json(postsWithCommentCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Tạo bài đăng mới (GIỮ NGUYÊN)
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, isAnonymous, username, eventId } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const newPost = new Post({
      content, imageUrl, isAnonymous, eventId,
      createdBy: user._id, likes: [],
    });
    await newPost.save();
    const populatedPost = await newPost.populate("createdBy", "username avatar");
    res.status(201).json({ ...populatedPost.toObject(), commentCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Like / Unlike (GIỮ NGUYÊN)
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body; 
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    const userId = user._id;
    const isLiked = post.likes.some(id => id.toString() === userId.toString());

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.status(200).json(post.likes); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Lấy danh sách like (GIỮ NGUYÊN)
export const getLikesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("likes", "username avatar role"); // Thêm role để hiển thị màu avatar đúng
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post.likes); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Upload ảnh (GIỮ NGUYÊN)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 6. Cập nhật bài đăng (SỬA LOGIC)
// ==========================================
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username, content } = req.body; 

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Logic: Chỉ người tạo bài viết mới được sửa nội dung
    const isPostOwner = post.createdBy.toString() === user._id.toString();

    if (!isPostOwner) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài đăng này" });
    }

    post.content = content;
    await post.save();

    const updatedPost = await Post.findById(postId).populate("createdBy", "username avatar");
    const commentCount = await Comment.countDocuments({ postId: post._id });
    
    res.status(200).json({ ...updatedPost.toObject(), commentCount: commentCount });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 7. Xóa bài đăng (SỬA LOGIC QUAN TRỌNG)
// ==========================================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // --- KIỂM TRA QUYỀN SỞ HỮU EVENT ---
    // Tìm sự kiện dựa trên eventId trong bài post
    const event = await Event.findById(post.eventId);
    
    // Quyền 1: Là người viết bài
    const isPostOwner = post.createdBy.toString() === user._id.toString();
    
    // Quyền 2: Là người tạo ra Event (Chủ nhóm)
    // Cần kiểm tra xem event có tồn tại không trước khi check createdBy
    let isEventOwner = false;
    if (event) {
        // Kiểm tra createdBy của Event (có thể là object hoặc string ID tùy cách lưu)
        const eventCreatorId = event.createdBy._id ? event.createdBy._id.toString() : event.createdBy.toString();
        isEventOwner = eventCreatorId === user._id.toString();
    }
    
    // Quyền 3 (Tùy chọn): Admin hệ thống
    const isSystemAdmin = user.role === 'admin';

    // Chỉ cho phép nếu là Post Owner HOẶC Event Owner HOẶC Admin
    if (!isPostOwner && !isEventOwner && !isSystemAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    // Xóa tất cả bình luận liên quan
    await Comment.deleteMany({ postId: postId });
    
    // Xóa bài đăng
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ message: err.message });
  }
};