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
    const res = await registerUser(form);
    setMsg(res.message || "Đăng ký thành công");
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
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
        ← Quay về trang chủ
      </button>
      {msg && <p className="message">{msg}</p>}
    </div>
  );
}
