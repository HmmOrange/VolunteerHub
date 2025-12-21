/**
 * API Comments - các hàm tương tác với backend cho Comment
 * - `getCommentsByPost(postId)`: GET /api/comments/post/:postId, trả về danh sách comment.
 * - `createComment(data)`: POST /api/comments/create với body JSON `data`, trả về comment vừa tạo.
 */
const API_URL = "http://localhost:5000/api/comments";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export const getCommentsByPost = async (postId) => {
  const res = await fetch(`${API_URL}/post/${postId}`, {
      headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
};

export const createComment = async (data) => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
};