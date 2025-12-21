/**
 * API Posts - hàm tương tác với backend cho Post
 * - `getPostsByEvent(eventId)`, `createPost(data)`, `likePost(postId, username)`, `getLikesByPost(postId)`
 * - `uploadImage(formData)` dùng multipart/form-data, `updatePost`, `deletePost` và pagination helper.
 */
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
/**
 * Upload ảnh cho post (uploadImage)
 * - Input: `formData` chứa field `image` hoặc file.
 * - Ghi chú: không set Content-Type để browser tự thiết lập boundary.
 */
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

/**
 * Cập nhật nội dung post (updatePost)
 */
export const updatePost = async (postId, username, content) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ username, content }),
  });
  if (!res.ok) throw new Error("Cập nhật bài đăng thất bại");
  return res.json();
};

/**
 * Xóa post (deletePost)
 */
export const deletePost = async (postId, username) => {
  const res = await fetch(`${API_URL}/${postId}`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Xóa bài đăng thất bại");
  return res.json();
};

export const getPostsByEventsPaginated = async (eventIds, page = 1, limit = 10) => {
  const eventIdsParam = Array.isArray(eventIds) ? eventIds.join(',') : eventIds;
  const res = await fetch(`${API_URL}/by-events?eventIds=${eventIdsParam}&page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
};

export const getAllPublicPosts = async (page = 1, limit = 10, userId = null) => {
  const userParam = userId ? `&userId=${userId}` : '';
  const res = await fetch(`${API_URL}/public?page=${page}&limit=${limit}${userParam}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch public posts");
  return res.json();
};