import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/Auth";
import { ArrowLeft } from "lucide-react"; 
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import "./Login.css";

// Bạn có thể thay link ảnh này bằng ảnh thật của dự án
const heroImage = "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=2074&auto=format&fit=crop";

/*
  Page: `Login`

  Mô tả:
  - Trang đăng nhập cơ bản với form `identifier` và `password`.
  - Gọi API `loginUser` từ `src/api/Auth` để nhận token và lưu vào `localStorage`.
  - Sau khi đăng nhập thành công sẽ chuyển hướng về `/dashboard`.
*/

export default function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateIdentifier = (value) => {
    if (!value.trim()) return "Vui lòng nhập email hoặc tên đăng nhập";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Vui lòng nhập mật khẩu";
    if (value.length < 3) return "Mật khẩu phải có ít nhất 3 ký tự";
    return "";
  };

  const handleBlur = (field) => {
    let error = "";
    if (field === "identifier") error = validateIdentifier(form.identifier);
    else if (field === "password") error = validatePassword(form.password);
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const identifierError = validateIdentifier(form.identifier);
    const passwordError = validatePassword(form.password);

    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError });
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginUser(form);
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("_id", res.user.id);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("role", res.user.role);
        localStorage.setItem("avatar", res.user.avatar || "");

        setMsg("Đăng nhập thành công! Đang chuyển hướng...");
        
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setMsg(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* CỘT HÌNH ẢNH (LEFT) */}
      <div className="login-visual" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="visual-overlay">
          <div className="brand-header">
            <div className="logo-circle">
              <VolunteerActivismIcon sx={{ fontSize: 28, color: '#49BBBD' }} />
            </div>
            <h1 className="brand-name" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
              <span style={{ color: '#000000' }}>Volunteer</span><span style={{ color: '#49BBBD' }}>Hub</span>
            </h1>
          </div>
          
          <div className="quote-container">
            <p className="quote-content">"Không ai nghèo đi vì cho đi. Hãy cùng chúng tôi lan tỏa yêu thương đến cộng đồng."</p>
            <div className="quote-deco-line"></div>
          </div>
        </div>
      </div>

      {/* CỘT FORM (RIGHT) */}
      <div className="login-content">
        <div className="form-box" style={{ border: '2px solid #49BBBD', borderRadius: '1rem', padding: '2rem' }}>
          <div className="form-header">
            <h2>Chào bạn!</h2>
            <p>Nhập thông tin đăng nhập để truy cập hệ thống.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email hoặc Tên đăng nhập</label>
              <input
                type="text"
                placeholder="Ví dụ: user@example.com"
                value={form.identifier}
                onChange={(e) => {
                  setForm({ ...form, identifier: e.target.value });
                  setErrors({ ...errors, identifier: "" });
                }}
                onBlur={() => handleBlur("identifier")}
                className={errors.identifier ? "error" : ""}
              />
              {errors.identifier && <span className="error-text">{errors.identifier}</span>}
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  setErrors({ ...errors, password: "" });
                }}
                onBlur={() => handleBlur("password")}
                className={errors.password ? "error" : ""}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <span className="spinner"></span> : "Đăng Nhập"}
            </button>
          </form>

          <div className="form-footer">
            <p>Chưa có tài khoản? <span className="link-highlight" onClick={() => navigate("/register")}>Đăng ký ngay</span></p>
            <button onClick={() => navigate("/")} className="btn-back">
              <ArrowLeft size={16} /> Quay về trang chủ
            </button>
          </div>

          {msg && (
            <div className={`alert-box ${msg.includes("thành công") ? "success" : "error"}`}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}