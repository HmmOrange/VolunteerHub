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
    setMsg("");

    try {
      const res = await loginUser(form);
      
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("role", res.user.role);

        setMsg("Đăng nhập thành công! Đang chuyển hướng...");

        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setMsg(error.message || "Đăng nhập thất bại, đã xảy ra lỗi");
    }
  };

  return (
    <div className="login-container">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Email hoặc Tên đăng nhập"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Đăng nhập</button>
      </form>
      <button onClick={() => navigate("/")} className="back-home-btn">
        ← Quay về trang trước
      </button>
      
      {msg && (
        <p className="message" style={{ color: msg.includes("thành công") ? "green" : "red" }}>
          {msg}
        </p>
      )}
    </div>
  );
}