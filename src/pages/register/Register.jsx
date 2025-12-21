import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import { uploadAvatar } from "../../api/Users";
import { UserPlus, Camera, ArrowLeft, Check, ArrowRight } from "lucide-react";
import "./Register.css";

const registerImage = "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop";

export default function Register() {
  const navigate = useNavigate();

  // ===== CAPTCHA =====
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  useEffect(() => {
    fetch("/api/captcha")
      .then((res) => res.json())
      .then(setCaptcha)
      .catch(() => setCaptcha(null));
  }, []);

  // ===== STEP CONTROL =====
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ===== DATA STATE =====
  const [accountForm, setAccountForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dob: "",
    address: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ================= BƯỚC 1: CHỈ VALIDATE VÀ CHUYỂN BƯỚC =================
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    // Validate cơ bản
    if (accountForm.password !== accountForm.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    if (!captchaAnswer) {
      setError("Vui lòng nhập mã xác thực");
      return;
    }

    // Nếu ổn thì chuyển sang bước 2 (Chưa gọi API)
    setStep(2);
  };

  // ================= BƯỚC 2: GỌI API ĐĂNG KÝ + CẬP NHẬT PROFILE =================
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!profileForm.fullName.trim()) {
      setError("Họ và tên là bắt buộc");
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ GỌI API ĐĂNG KÝ (Sử dụng dữ liệu từ Bước 1)
      const res = await registerUser({
        email: accountForm.email,
        username: accountForm.username,
        password: accountForm.password,
        captchaAnswer,
        captchaToken: captcha?.token,
      });

      // Lưu Token tạm thời
      const token = res.token;
      localStorage.setItem("token", token);
      
      // Lưu thông tin cơ bản để hiển thị nếu cần
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("username", res.user.username);
      localStorage.setItem("role", res.user.role);

      // 2️⃣ GỌI API CẬP NHẬT PROFILE (Sử dụng dữ liệu Bước 2)
      // Lưu ý: Đảm bảo backend endpoint này hoạt động
      const profileRes = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Dùng token vừa nhận được
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          dateOfBirth: profileForm.dob,
          address: profileForm.address,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.message || "Cập nhật thông tin thất bại");
      }

      // 3️⃣ UPLOAD AVATAR (Nếu có)
      let finalAvatar = "";
      if (avatarFile) {
        const uploadRes = await uploadAvatar(avatarFile);
        finalAvatar = uploadRes.avatar;
        localStorage.setItem("avatar", finalAvatar);
      }

      setMsg("Đăng ký thành công! Đang vào hệ thống...");

      setTimeout(() => {
        // Chuyển hướng thẳng vào dashboard hoặc trang login tùy logic
        // window.location.href = "/dashboard"; 
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error(err);
      // Nếu lỗi ở bước đăng ký, có thể do trùng username/email -> Quay về bước 1 để sửa
      if (err.message.includes("email") || err.message.includes("username") || err.message.includes("tồn tại")) {
        setError(err.message + ". Vui lòng quay lại bước 1 để kiểm tra.");
      } else {
        setError(err.message || "Đăng ký thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===== AVATAR HANDLER =====
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="register-wrapper">
      <div className="register-visual" style={{ backgroundImage: `url(${registerImage})` }}>
        <div className="visual-overlay">
          <div className="brand-header">
            <div className="logo-circle"><UserPlus size={28} color="#49BBBD" /></div>
            <h1 className="brand-name">VolunteerHub</h1>
          </div>
        </div>
      </div>

      <div className="register-content">
        <div className="form-box">
          <div className="form-header">
            <h2>Tạo tài khoản mới</h2>
            <p>Hoàn thành các bước để trở thành thành viên.</p>
          </div>

          {/* STEPPER: Có thể click để quay lại */}
          <div className="stepper">
            <div 
              className={`step-item ${step >= 1 ? "active" : ""}`}
              onClick={() => setStep(1)} 
              style={{cursor: 'pointer'}}
            >
              <div className="step-circle">1</div>
              <span className="step-label">Tài khoản</span>
            </div>
            <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`step-item ${step >= 2 ? "active" : ""}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Cá nhân</span>
            </div>
          </div>

          {error && <div className="alert-box error">{error}</div>}
          {msg && <div className="alert-box success">{msg}</div>}

          {/* ===== FORM BƯỚC 1 ===== */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="auth-form slide-in">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nhập lại</label>
                  <input
                    type="password"
                    value={accountForm.confirmPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group captcha-group">
                <label>Mã xác thực: <span className="captcha-question">{captcha?.question || "..."}</span></label>
                <input
                  type="text"
                  placeholder="Nhập kết quả..."
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary">
                Tiếp tục <ArrowRight size={18}/>
              </button>
            </form>
          )}

          {/* ===== FORM BƯỚC 2 (CÓ NÚT QUAY LẠI) ===== */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="auth-form slide-in">
              <div className="avatar-upload-section">
                <div 
                  className="avatar-preview" 
                  onClick={() => fileInputRef.current.click()}
                  style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : {}}
                >
                  {!avatarPreview && <Camera size={32} color="#49BBBD" />}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                <span className="avatar-hint">Nhấn để tải ảnh đại diện</span>
              </div>

              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              {/* ACTION BUTTONS: QUAY LẠI & HOÀN TẤT */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setStep(1)} // Quay lại bước 1
                  disabled={isLoading}
                >
                  <ArrowLeft size={18}/> Quay lại
                </button>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? <span className="spinner"></span> : <>Hoàn tất <Check size={18}/></>}
                </button>
              </div>
            </form>
          )}

          <div className="form-footer">
            <p>Đã có tài khoản? <span className="link-highlight" onClick={() => navigate("/login")}>Đăng nhập ngay</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}