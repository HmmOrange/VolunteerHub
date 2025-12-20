const API_URL = "http://localhost:5000/api/users";

export const getAllUsers = async () => {
  const res = await fetch(`${API_URL}/all`);
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  return res.json();
};

export const updateUserRole = async (userId, newRole) => {
  const res = await fetch(`${API_URL}/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to toggle lock");
  }
  
  return res.json();
};

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  const res = await fetch(
    "http://localhost:5000/api/users/profile/avatar",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
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

