import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/Auth";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { // Thêm try...catch
      const res = await loginUser(form);
      
      if (res.token) {
        // === SỬA KHỐI NÀY ===
        localStorage.setItem("token", res.token);
        localStorage.setItem("userId", res.user.id); // <-- THÊM DÒNG NÀY
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("role", res.user.role);
        // ===================

        setMsg("Đăng nhập thành công! Đang chuyển hướng...");

        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMsg(res.message || "Login failed");
      }
    } catch (error) {
      // Hiển thị lỗi nếu API trả về 400 hoặc 500
      setMsg(error.response?.data?.message || "Đăng nhập thất bại, đã xảy ra lỗi");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Email/Tên đăng nhập"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
      </form>
      <button onClick={() => navigate("/")} className="back-home-btn">
        ← Quay về trang trước
      </button>
      {msg && <p className="message">{msg}</p>}
    </div>
  );
}