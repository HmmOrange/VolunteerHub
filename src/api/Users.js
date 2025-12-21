const API_URL = "http://localhost:5000/api/users";

/* ================= HELPERS ================= */

const authHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

// 3. Helper chỉ lấy Auth (Dùng cho Upload file - quan trọng!)
const getAuthOnlyHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated");
  }
  return {
    "Authorization": `Bearer ${token}`,
  };
};

/* ================= USERS ================= */

export const getAllUsers = async () => {
  const res = await fetch(`${API_URL}/all`, {
    headers: authHeader(),
  });

  if (!res.ok) {
    // Giữ xử lý lỗi chi tiết của orange
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch users");
  }

  return res.json();
};

export const updateUserRole = async (userId, newRole) => {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify({ newRole }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update role");
  }

  return res.json();
};

export const toggleUserLock = async (userId) => {
  const res = await fetch(`${API_URL}/${userId}/lock`, {
    method: "PUT",
    headers: authHeader(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to toggle lock");
  }

  return res.json();
};

/* ================= ADMIN: CREATE MANAGER ================= */

export const createManager = async (payload) => {
  const res = await fetch(`${API_URL}/admin/create-manager`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create manager");
  }

  return res.json();
};

/* ================= PROFILE ================= */

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/profile`, {
    headers: authHeader(),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch profile");
  }
  return res.json();
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  // LƯU Ý QUAN TRỌNG:
  // Không dùng authHeader() ở đây vì FormData tự động set Content-Type là multipart/form-data kèm boundary.
  // Nếu set cứng application/json thì upload sẽ lỗi.
  // Dùng getAuthOnlyHeader() để chỉ gửi Authorization mà KHÔNG set Content-Type.
  
  const res = await fetch(`${API_URL}/profile/avatar`, {
    method: "PUT",
    headers: getAuthOnlyHeader(), // ❗ Chỉ gửi Authorization, để browser tự set Content-Type
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Upload avatar failed");
  }
  return res.json();
};

export const setBadgeVisibility = async (eventId, visible) => {
  const res = await fetch(`${API_URL}/profile/badge-visibility`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ eventId, visible })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update badge visibility');
  }

  return res.json();
};