import Post from "../models/Post.js";
import User from "../models/User.js";
import Event from "../models/Event.js"; 
import Comment from "../models/Comment.js"; 
import { createNotificationInternal } from "../controllers/notificationController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

// 1. Lấy tất cả bài đăng của sự kiện
export const getPostsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const posts = await Post.find({ eventId: eventId })
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

// 2. Tạo bài đăng mới
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, isAnonymous, username, eventId } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    let finalImageUrl = imageUrl;

    // Nếu imageUrl là banner path, copy sang thư mục post-images
    if (imageUrl && imageUrl.startsWith("/uploads/banners/")) {
      try {
        const postImagesDir = path.join(__dirname, "../uploads/post-images");
        if (!fs.existsSync(postImagesDir)) {
          fs.mkdirSync(postImagesDir, { recursive: true });
        }

        const sourcePath = path.join(__dirname, "..", imageUrl);
        const fileName = path.basename(imageUrl);
        const destPath = path.join(postImagesDir, fileName);

        // Copy file thay vì move
        fs.copyFileSync(sourcePath, destPath);
        finalImageUrl = `/uploads/post-images/${fileName}`;
      } catch (copyErr) {
        console.error("Error copying banner to post-images:", copyErr);
        // Nếu copy lỗi, vẫn dùng imageUrl gốc
      }
    }

    const newPost = new Post({
      content, imageUrl: finalImageUrl, isAnonymous, eventId,
      createdBy: user._id, likes: [],
    });
    await newPost.save();
    
    const populatedPost = await newPost.populate("createdBy", "username avatar role");
    
    res.status(201).json({ ...populatedPost.toObject(), commentCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Like / Unlike
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
      
      // --- THÔNG BÁO: User like bài viết ---
      if (post.createdBy.toString() !== userId.toString()) {
        await createNotificationInternal({
          recipientId: post.createdBy,
          type: "POST_LIKED",
          message: `${user.username} đã thích bài viết của bạn.`,
          
          // [SỬA] Trỏ thẳng về Event
          relatedId: post.eventId, 
          relatedModel: "Event"
        });
      }
    }
    await post.save();
    res.status(200).json(post.likes); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Lấy danh sách like
export const getLikesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("likes", "username avatar role"); 
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post.likes); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Upload ảnh
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Cập nhật bài đăng
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { username, content } = req.body; 

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    const isPostOwner = post.createdBy.toString() === user._id.toString();

    if (!isPostOwner) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài đăng này" });
    }

    post.content = content;
    await post.save();

    const updatedPost = await Post.findById(postId).populate("createdBy", "username avatar role");
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

    // --- THÔNG BÁO: Nếu bài bị xóa bởi người khác ---
    if (!isPostOwner) {
       await createNotificationInternal({
         recipientId: post.createdBy,
         type: "POST_DELETED_BY_OWNER",
         message: `Bài viết của bạn trong sự kiện "${event ? event.name : 'Unknown'}" đã bị quản trị viên xóa.`,
         
         // [ĐÚNG RỒI] Vẫn giữ nguyên trỏ về Event
         relatedId: post.eventId, 
         relatedModel: "Event"
       });
    }

    await Comment.deleteMany({ postId: postId });
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài đăng thành công" });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// [GIỮ LẠI ĐỂ DÙNG NẾU CẦN] Lấy chi tiết 1 bài Post
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("eventId"); 

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 8. Lấy posts từ nhiều events với pagination
export const getPostsByEvents = async (req, res) => {
  try {
    const { eventIds, page = 1, limit = 10 } = req.query;
    
    if (!eventIds) {
      return res.status(400).json({ message: "Missing eventIds parameter" });
    }

    // Parse eventIds (có thể là string hoặc array)
    const eventIdsArray = Array.isArray(eventIds) ? eventIds : eventIds.split(',');
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Đếm tổng số posts
    const total = await Post.countDocuments({ eventId: { $in: eventIdsArray } });
    
    // Lấy posts với pagination
    const posts = await Post.find({ eventId: { $in: eventIdsArray } })
      .populate("createdBy", "username avatar role")
      .populate("eventId", "name slug _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Thêm commentCount cho mỗi post
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return { ...post.toObject(), commentCount: commentCount };
      })
    );

    res.status(200).json({
      posts: postsWithCommentCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total,
      hasMore: skip + posts.length < total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};