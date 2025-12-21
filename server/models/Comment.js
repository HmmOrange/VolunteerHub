/**
 * Model Comment
 * - Mô tả: Lưu trữ bình luận của người dùng trên một Post.
 * - Trường chính: `content`, `createdBy` (ref User), `postId` (ref Post).
 * - Tự động thêm `createdAt`/`updatedAt` nhờ `timestamps`.
 */
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;