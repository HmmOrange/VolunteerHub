import Post from "../models/Post.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Comment from "../models/Comment.js"; 

// 1. Lấy tất cả bài đăng của sự kiện
export const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const posts = await Post.find({ eventId: eventId })
      .populate("createdBy", "username avatar")
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

// 2. Tạo bài đăng mới
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
    
    const populatedPost = await newPost.populate("createdBy", "username avatar");
    res.status(201).json({ ...populatedPost.toObject(), commentCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Like / Unlike bài đăng
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body; 

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    const userId = user._id;

    // Kiểm tra xem user đã like chưa (so sánh string ID)
    const isLiked = post.likes.some(id => id.toString() === userId.toString());

    if (isLiked) {
      // Nếu đã like -> Xóa khỏi mảng
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Nếu chưa like -> Thêm vào mảng
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post.likes); 

  } catch (err) {
    console.error("Lỗi likePost:", err);
    res.status(500).json({ message: err.message });
  }
};

// 4. Lấy danh sách người đã like (cho Dialog)
export const getLikesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
                           .populate("likes", "username avatar"); // Chỉ lấy username và avatar của người like

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post.likes); 

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Upload ảnh (trả về URL)
export const uploadImage = async (req, res) => {
  try {
    // Kiểm tra file từ Multer
    if (!req.file) {
      return res.status(400).json({ message: "Chưa chọn file" });
    }

    // Tạo đường dẫn ảnh: http://localhost:5000/uploads/ten_file.png
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    
    res.status(200).json({ imageUrl: imageUrl });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Cập nhật nội dung bài đăng
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username, content } = req.body; 

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Kiểm tra quyền
    const isOwner = post.createdBy.toString() === user._id.toString();
    const isManager = user.role === 'manager';

    if (!isOwner && !isManager) {
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

// 7. Xóa bài đăng
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Kiểm tra quyền
    const isOwner = post.createdBy.toString() === user._id.toString();
    const isManager = user.role === 'manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    // Xóa tất cả bình luận liên quan
    await Comment.deleteMany({ postId: postId });
    
    // Xóa bài đăng
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};