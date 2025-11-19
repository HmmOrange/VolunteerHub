const API_URL = "http://localhost:5000/api/auth";

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Đăng ký thất bại");
  }
  return json;
};

export const loginUser = async (data) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.message || "Đăng nhập thất bại");
    }
    return json;
};