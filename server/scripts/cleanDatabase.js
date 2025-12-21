import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import JoinRequest from "../models/JoinRequest.js";
import Notification from "../models/Notification.js";

dotenv.config();

const cleanDatabase = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    // 1. Xóa tất cả events
    const deletedEvents = await Event.deleteMany({});
    console.log(`🗑️  Đã xóa ${deletedEvents.deletedCount} events`);

    // 2. Xóa tất cả users NGOẠI TRỪ admin và manager
    const deletedUsers = await User.deleteMany({
      role: { $nin: ["admin", "manager"] }
    });
    console.log(`🗑️  Đã xóa ${deletedUsers.deletedCount} users (giữ lại admin/manager)`);

    // 3. Xóa các dữ liệu liên quan (posts, comments, join requests, notifications)
    const deletedPosts = await Post.deleteMany({});
    console.log(`🗑️  Đã xóa ${deletedPosts.deletedCount} posts`);

    const deletedComments = await Comment.deleteMany({});
    console.log(`🗑️  Đã xóa ${deletedComments.deletedCount} comments`);

    const deletedRequests = await JoinRequest.deleteMany({});
    console.log(`🗑️  Đã xóa ${deletedRequests.deletedCount} join requests`);

    const deletedNotifications = await Notification.deleteMany({});
    console.log(`🗑️  Đã xóa ${deletedNotifications.deletedCount} notifications`);

    // Hiển thị users còn lại
    const remainingUsers = await User.find({}, "username email role");
    console.log("\n👥 Users còn lại:");
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    console.log("\n✅ Hoàn tất dọn dẹp database!");
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

cleanDatabase();
