const API_URL = "http://localhost:5000/api/users";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export const getAllUsers = async () => {
  const res = await fetch(`${API_URL}/all`, {
      headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export const updateUserRole = async (userId, newRole) => {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ newRole }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update role");
  }
  return res.json();
};

export const toggleUserLock = async (userId) => {
  const res = await fetch(`${API_URL}/${userId}/lock`, {
    method: "PUT",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to toggle lock");
  }
  return res.json();
};

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/profile`, {
    headers: getHeaders(), // Đã tối ưu
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch profile");
  }
  return res.json();
};

export const uploadAvatar = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/profile/avatar`, {
      method: "PUT",
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Upload avatar failed");
  }
  return res.json();
};