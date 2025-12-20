import Post from "../models/Post.js";
import User from "../models/User.js";
import Event from "../models/Event.js"; 
import Comment from "../models/Comment.js"; 

// 1. Lấy tất cả bài đăng của sự kiện (SỬA: THÊM role VÀO POPULATE)
export const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const posts = await Post.find({ eventId: eventId })
      // --- SỬA TẠI ĐÂY: Thêm "role" vào chuỗi cần lấy ---
      .populate("createdBy", "username avatar role") 
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

// 2. Tạo bài đăng mới (SỬA: THÊM role VÀO POPULATE)
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
    
    // --- SỬA TẠI ĐÂY: Thêm "role" để khi tạo xong nó hiện đúng màu ngay ---
    const populatedPost = await newPost.populate("createdBy", "username avatar role");
    
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

// 4. Lấy danh sách like (GIỮ NGUYÊN - Đã có role rồi)
export const getLikesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    // Chỗ này bạn đã làm đúng: "username avatar role"
    const post = await Post.findById(postId).populate("likes", "username avatar role"); 
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

// 6. Cập nhật bài đăng (SỬA: THÊM role VÀO POPULATE)
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

    // --- SỬA TẠI ĐÂY: Thêm "role" để sau khi sửa không bị mất màu ---
    const updatedPost = await Post.findById(postId).populate("createdBy", "username avatar role");
    
    const commentCount = await Comment.countDocuments({ postId: post._id });
    
    res.status(200).json({ ...updatedPost.toObject(), commentCount: commentCount });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. Xóa bài đăng (GIỮ NGUYÊN)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    const event = await Event.findById(post.eventId);
    
    const isPostOwner = post.createdBy.toString() === user._id.toString();
    
    let isEventOwner = false;
    if (event) {
        const eventCreatorId = event.createdBy._id ? event.createdBy._id.toString() : event.createdBy.toString();
        isEventOwner = eventCreatorId === user._id.toString();
    }
    
    const isSystemAdmin = user.role === 'admin';

    if (!isPostOwner && !isEventOwner && !isSystemAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    await Comment.deleteMany({ postId: postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ message: err.message });
  }
};