import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await registerUser(form);
      setMsg("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      // Hiển thị lỗi cụ thể từ Backend (vd: Tên đăng nhập đã được sử dụng)
      console.error("Lỗi đăng ký:", error);
      setMsg(error.message); 
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text" // Email nên để type="email" để validate sơ bộ
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Đăng ký</button>
      </form>
      <button onClick={() => navigate("/")} className="back-home-btn">
        ← Quay về trang trước
      </button>
      
      {/* Hiển thị thông báo. Nếu là lỗi thì nên CSS màu đỏ */}
      {msg && <p className="message" style={{ color: msg.includes("thành công") ? "green" : "red" }}>{msg}</p>}
    </div>
  );
}