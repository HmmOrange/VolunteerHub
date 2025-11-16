const API_URL = "http://localhost:5000/api/posts";

// Lấy tất cả bài đăng của 1 sự kiện
export const getPostsByEvent = async (eventId) => {
  const res = await fetch(`${API_URL}/event/${eventId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  return res.json();
};

// Tạo bài đăng mới
export const createPost = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to create post");
  }
  return res.json();
};

// === THÊM HÀM MỚI NÀY VÀO CUỐI FILE ===
export const likePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }), // Gửi username
  });
  if (!res.ok) {
    throw new Error("Failed to like post");
  }
  return res.json(); // Trả về mảng likes mới
};

export const getLikesByPost = async (postId) => {
  const res = await fetch(`${API_URL}/${postId}/likes`);
  if (!res.ok) {
    throw new Error("Failed to fetch likes");
  }
  return res.json(); // Trả về mảng user (vd: [{_id: ..., username: ...}])
};