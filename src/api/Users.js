const API_URL = "http://localhost:5000/api/users";

// ================= HELPERS =================
const authHeader = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ================= USERS =================
export const getAllUsers = async () => {
  const res = await fetch(`${API_URL}/all`, {
    headers: {
      ...authHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch users");
  }

  return res.json();
};

export const updateUserRole = async (userId, newRole) => {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
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
    headers: {
      ...authHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to toggle lock");
  }

  return res.json();
};

// ================= ADMIN: CREATE MANAGER =================
export const createManager = async (payload) => {
  const res = await fetch(`${API_URL}/admin/create-manager`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create manager");
  }

  return res.json();
};

// ================= PROFILE =================
export const getProfile = async () => {
  const res = await fetch(`${API_URL}/profile`, {
    headers: {
      ...authHeader(),
    },
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

  const res = await fetch(`${API_URL}/profile/avatar`, {
    method: "PUT",
    headers: {
      ...authHeader(),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Upload avatar failed");
  }

  return res.json();
};
