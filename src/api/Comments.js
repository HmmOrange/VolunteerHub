const API_URL = "http://localhost:5000/api/comments";

// Lấy tất cả bình luận của 1 bài đăng
export const getCommentsByPost = async (postId) => {
  const res = await fetch(`${API_URL}/post/${postId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch comments");
  }
  return res.json();
};

// Tạo bình luận mới
export const createComment = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create comment");
  }
  return res.json();
};