const API_URL = "http://localhost:5000/api/posts";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export const getPostsByEvent = async (eventId) => {
  const res = await fetch(`${API_URL}/event/${eventId}`, {
      headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
};

export const createPost = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
};

export const likePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}/like`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ username }), 
  });
  if (!res.ok) throw new Error("Failed to like post");
  return res.json(); 
};

export const getLikesByPost = async (postId) => {
  const res = await fetch(`${API_URL}/${postId}/likes`, {
      headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch likes");
  return res.json(); 
};

// UPLOAD ẢNH (Không dùng getHeaders vì Content-Type khác)
export const uploadImage = async (formData) => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: {
         "Authorization": token ? `Bearer ${token}` : "", // Chỉ cần Token, không set Content-Type
      },
      body: formData,
    });
    if (!res.ok) throw new Error("Tải ảnh lên thất bại");
    return res.json();
  } catch (error) {
    console.error("Lỗi uploadImage API:", error);
    throw error;
  }
};

export const updatePost = async (postId, username, content) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ username, content }),
  });
  if (!res.ok) throw new Error("Cập nhật bài đăng thất bại");
  return res.json();
};

export const deletePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Xóa bài đăng thất bại");
  return res.json();
};