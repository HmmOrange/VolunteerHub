const API_URL = "http://localhost:5000/api/posts";

export const getPostsByEvent = async (eventId) => {
  const res = await fetch(`${API_URL}/event/${eventId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  return res.json();
};

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

export const likePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }), 
  });
  if (!res.ok) {
    throw new Error("Failed to like post");
  }
  return res.json(); 
};

export const getLikesByPost = async (postId) => {
  const res = await fetch(`${API_URL}/${postId}/likes`);
  if (!res.ok) {
    throw new Error("Failed to fetch likes");
  }
  return res.json(); 
};


// === THÊM HÀM MỚI NÀY VÀO CUỐI FILE ===
// Hàm này gửi FormData, không phải JSON
export const uploadImage = async (formData) => {
  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      // Không cần 'Content-Type', trình duyệt sẽ tự đặt
      body: formData,
    });
    
    if (!res.ok) {
      throw new Error("Tải ảnh lên thất bại");
    }
    
    return res.json(); // Trả về { imageUrl: "http://..." }
  } catch (error) {
    console.error("Lỗi uploadImage API:", error);
    throw error;
  }
};

// === THÊM HÀM MỚI (UPDATE) ===
export const updatePost = async (postId, username, content) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, content }),
  });
  if (!res.ok) {
    throw new Error("Cập nhật bài đăng thất bại");
  }
  return res.json(); // Trả về post đã cập nhật
};

// === THÊM HÀM MỚI (DELETE) ===
export const deletePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }), // Gửi username để kiểm tra quyền
  });
  if (!res.ok) {
    throw new Error("Xóa bài đăng thất bại");
  }
  return res.json();
};