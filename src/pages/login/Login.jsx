import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/Auth";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({ identifier: "", password: "" });
  const navigate = useNavigate();

  const validateIdentifier = (value) => {
    if (!value.trim()) {
      return "Vui lòng nhập email hoặc tên đăng nhập";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (!value) {
      return "Vui lòng nhập mật khẩu";
    }
    if (value.length < 3) {
      return "Mật khẩu phải có ít nhất 3 ký tự";
    }
    return "";
  };

  const handleBlur = (field) => {
    let error = "";
    if (field === "identifier") {
      error = validateIdentifier(form.identifier);
    } else if (field === "password") {
      error = validatePassword(form.password);
    }
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Validation
    const identifierError = validateIdentifier(form.identifier);
    const passwordError = validatePassword(form.password);

    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError });
      return;
    }

    try {
      const res = await loginUser(form);
      
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("role", res.user.role);
        localStorage.setItem("avatar", res.user.avatar || "");

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
        <div className="input-group">
          <input
            type="text"
            placeholder="Email hoặc Tên đăng nhập"
            value={form.identifier}
            onChange={(e) => {
              setForm({ ...form, identifier: e.target.value });
              setErrors({ ...errors, identifier: "" });
            }}
            onBlur={() => handleBlur("identifier")}
            className={errors.identifier ? "input-error" : ""}
            required
          />
          {errors.identifier && <span className="error-message">{errors.identifier}</span>}
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