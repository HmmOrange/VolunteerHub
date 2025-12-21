/**
 * Model Post
 * - Mô tả: Bài viết trong sự kiện (có thể là announcement tự động hoặc bài do user tạo).
 * - Trường chính: `content`, `imageUrl`, `isAnonymous`, `isEventAnnouncement`, `createdBy`, `eventId`, `likes`.
 * - Sử dụng timestamps để theo dõi createdAt/updatedAt.
 */
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isEventAnnouncement: {
      type: Boolean,
      default: false, // true nếu là bài đăng tự động từ sự kiện
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến model 'User'
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event", // Tham chiếu đến model 'Event'
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

const Post = mongoose.model("Post", postSchema);
export default Post;