import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({ email: "", username: "", password: "" });
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      return "Vui lòng nhập email";
    }
    if (!emailRegex.test(value)) {
      return "Email không hợp lệ";
    }
    return "";
  };

  const validateUsername = (value) => {
    if (!value.trim()) {
      return "Vui lòng nhập tên đăng nhập";
    }
    if (value.length < 3) {
      return "Tên đăng nhập phải có ít nhất 3 ký tự";
    }
    if (value.length > 20) {
      return "Tên đăng nhập không được quá 20 ký tự";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (!value) {
      return "Vui lòng nhập mật khẩu";
    }
    if (value.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (value.length > 50) {
      return "Mật khẩu không được quá 50 ký tự";
    }
    return "";
  };

  const handleBlur = (field) => {
    let error = "";
    if (field === "email") {
      error = validateEmail(form.email);
    } else if (field === "username") {
      error = validateUsername(form.username);
    } else if (field === "password") {
      error = validatePassword(form.password);
    }
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Validation
    const emailError = validateEmail(form.email);
    const usernameError = validateUsername(form.username);
    const passwordError = validatePassword(form.password);

    if (emailError || usernameError || passwordError) {
      setErrors({ email: emailError, username: usernameError, password: passwordError });
      return;
    }

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
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setErrors({ ...errors, email: "" });
            }}
            onBlur={() => handleBlur("email")}
            className={errors.email ? "input-error" : ""}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value });
              setErrors({ ...errors, username: "" });
            }}
            onBlur={() => handleBlur("username")}
            className={errors.username ? "input-error" : ""}
            required
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setErrors({ ...errors, password: "" });
            }}
            onBlur={() => handleBlur("password")}
            className={errors.password ? "input-error" : ""}
            required
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>
        <button type="submit">Đăng ký</button>
      </form>
      <button onClick={() => navigate("/")} className="back-home-btn">
        ← Quay về trang trước
      </button>
      
      {msg && <p className="message" style={{ color: msg.includes("thành công") ? "green" : "red" }}>{msg}</p>}
    </div>
  );
}