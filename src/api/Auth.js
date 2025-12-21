/**
 * API Auth - các hàm gọi tới backend để đăng ký và đăng nhập
 * - `registerUser(data)`: gửi request POST /api/auth/register với body JSON `data`.
 *   Trả về JSON chứa token và user khi thành công, ném Error khi thất bại.
 * - `loginUser(data)`: gửi request POST /api/auth/login với body JSON `data`.
 */
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