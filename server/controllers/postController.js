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

/**
 * Lấy danh sách bài đăng theo `eventId` (getPostsByEvent)
 * - Input: `req.params.eventId`.
 * - Hành động: tìm Post theo eventId, populate `createdBy` và đếm số bình luận cho mỗi post.
 * - Output: trả về mảng posts kèm `commentCount` hoặc lỗi.
 */
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

/**
 * Tạo bài viết mới trong sự kiện (createPost)
 * - Input: `req.body` chứa `content`, `imageUrl`, `isAnonymous`, `username`, `eventId`.
 * - Hành động: tìm user, xử lý copy ảnh nếu từ banner, tạo Post, gửi notification tới thành viên event (ngoại trừ người tạo).
 * - Output: trả về post vừa tạo (đã populate) hoặc lỗi.
 */
export const createPost = async (req, res) => {
  try {
    const { content, imageUrl, isAnonymous, username, eventId } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    let finalImageUrl = imageUrl;

    if (imageUrl && imageUrl.startsWith("/uploads/banners/")) {
      try {
        const postImagesDir = path.join(__dirname, "../uploads/post-images");
        if (!fs.existsSync(postImagesDir)) {
          fs.mkdirSync(postImagesDir, { recursive: true });
        }

        const sourcePath = path.join(__dirname, "..", imageUrl);
        const fileName = path.basename(imageUrl);
        const destPath = path.join(postImagesDir, fileName);

        fs.copyFileSync(sourcePath, destPath);
        finalImageUrl = `/uploads/post-images/${fileName}`;
      } catch (copyErr) {
        console.error("Error copying banner to post-images:", copyErr);
        
      }
    }

    const newPost = new Post({
      content, imageUrl: finalImageUrl, isAnonymous, eventId,
      createdBy: user._id, likes: [],
    });
    await newPost.save();
    
    const populatedPost = await newPost.populate("createdBy", "username avatar role");
    
    try {
      const event = await Event.findById(eventId).select("volunteers name createdBy");
      if (event) {
        const recipientSet = new Set();
        if (Array.isArray(event.volunteers)) {
          event.volunteers.forEach(v => recipientSet.add(v.toString()));
        }
        if (event.createdBy) recipientSet.add(event.createdBy.toString());

        
        recipientSet.delete(user._id.toString());

        const message = `${user.username} đã đăng bài mới trong sự kiện "${event.name || 'Sự kiện'}"`;

        await Promise.all(
          Array.from(recipientSet).map((recipientId) =>
            createNotificationInternal({
              recipientId,
              type: "NEW_POST",
              message,
              relatedId: eventId,
              relatedModel: "Event",
            })
          )
        );
      }
    } catch (notiErr) {
      console.error("Error creating notifications for new post:", notiErr);
    }

    res.status(201).json({ ...populatedPost.toObject(), commentCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Thích/huỷ thích bài viết (likePost)
 * - Input: `req.params.postId`, `req.body.username`.
 * - Hành động: toggle userId trong mảng `likes` của Post, tạo notification nếu like và người like khác với owner.
 * - Output: trả về mảng likes hiện tại hoặc lỗi.
 */
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

      if (post.createdBy.toString() !== userId.toString()) {
        await createNotificationInternal({
          recipientId: post.createdBy,
          type: "POST_LIKED",
          message: `${user.username} đã thích bài viết của bạn.`,
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

/**
 * Lấy danh sách người đã like một post (getLikesByPost)
 * - Input: `req.params.postId`.
 * - Hành động: populate trường `likes` của Post để trả về thông tin user.
 * - Output: trả về mảng users đã like hoặc lỗi.
 */
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

/**
 * Upload ảnh cho bài viết (uploadImage)
 * - Input: file từ multipart form (`req.file`).
 * - Hành động: trả về URL tạm thời của file upload.
 * - Output: object `{ imageUrl }` hoặc lỗi.
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa chọn file" });
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật nội dung bài đăng (updatePost)
 * - Input: `req.params.postId`, `req.body.username`, `req.body.content`.
 * - Hành động: kiểm tra quyền (chỉ owner được sửa), cập nhật content và trả về post đã cập nhật cùng commentCount.
 * - Output: updated post hoặc lỗi.
 */
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

/**
 * Xóa bài đăng (deletePost)
 * - Input: `req.params.postId`, `req.body.username`.
 * - Hành động: kiểm tra quyền (owner/event owner/admin), xóa comment liên quan, xóa post và gửi notification nếu cần.
 * - Output: message xác nhận hoặc lỗi.
 */
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

    if (!isPostOwner) {
       await createNotificationInternal({
         recipientId: post.createdBy,
         type: "POST_DELETED_BY_OWNER",
         message: `Bài viết của bạn trong sự kiện "${event ? event.name : 'Unknown'}" đã bị quản trị viên xóa.`,
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

/**
 * Lấy chi tiết một Post theo id (getPostById)
 * - Input: `req.params.postId`.
 * - Hành động: tìm Post và populate event, trả về hoặc lỗi 404.
 * - Output: object post hoặc lỗi.
 */
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

/**
 * Lấy posts từ nhiều events (getPostsByEvents) với pagination
 * - Input: query params `eventIds`, `page`, `limit`.
 * - Hành động: phân trang, lấy posts, populate thông tin và trả về commentCount / tổng trang.
 * - Output: object chứa posts, pagination info hoặc lỗi.
 */
export const getPostsByEvents = async (req, res) => {
  try {
    const { eventIds, page = 1, limit = 10 } = req.query;
    
    if (!eventIds) {
      return res.status(400).json({ message: "Missing eventIds parameter" });
    }

    const eventIdsArray = Array.isArray(eventIds) ? eventIds.split(',') : eventIds.split(',');
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Post.countDocuments({ eventId: { $in: eventIdsArray } });
    
    const posts = await Post.find({ eventId: { $in: eventIdsArray } })
      .populate("createdBy", "username avatar role")
      .populate("eventId", "name slug _id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

/**
 * Lấy tất cả bài đăng công khai cho Dashboard (getAllPublicPosts)
 * - Input: query params `page`, `limit`, optional `userId`.
 * - Hành động: tìm posts announcement từ events đã approved và (nếu userId) cả bài từ events user đã join; pagination.
 * - Output: danh sách posts với commentCount, pagination info hoặc lỗi.
 */
export const getAllPublicPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const approvedEvents = await Event.find({ status: "approved" }).select('_id volunteers');
    const approvedEventIds = approvedEvents.map(e => e._id);
    
    let joinedEventIds = [];
    if (userId) {
      joinedEventIds = approvedEvents
        .filter(event => event.volunteers && event.volunteers.some(v => v.toString() === userId))
        .map(e => e._id);
    }
    
    let query;
    
    if (userId && joinedEventIds.length > 0) {
      query = {
        $or: [
          {
            eventId: { $in: approvedEventIds },
            isEventAnnouncement: true
          },
          {
            eventId: { $in: joinedEventIds },
            $or: [
              { isEventAnnouncement: { $exists: false } },
              { isEventAnnouncement: null },
              { isEventAnnouncement: false }
            ]
          }
        ]
      };
    } else {
      query = {
        eventId: { $in: approvedEventIds },
        isEventAnnouncement: true
      };
    }
    
    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate("createdBy", "username avatar role")
      .populate("eventId", "name slug _id volunteers")
      .sort({ 
        isEventAnnouncement: -1, 
        createdAt: -1 
      })
      .skip(skip)
      .limit(parseInt(limit));

    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        const postObj = post.toObject();
        
        if (userId && postObj.eventId.volunteers) {
          postObj.userJoinedEvent = postObj.eventId.volunteers.some(
            v => v.toString() === userId
          );
        }
        
        return { ...postObj, commentCount };
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