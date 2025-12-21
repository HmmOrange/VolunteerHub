import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import { uploadAvatar } from "../../api/Users";
import { UserPlus, Camera, ArrowLeft, Check, ArrowRight } from "lucide-react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
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

  // Validation state
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
    captcha: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    captcha: "",
  });

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // 3-20 chars, letters/numbers/underscore
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+={}\[\]|\\:;"'<>.,.?/~`]).{8,}$/;

  const validateField = (name, value) => {
    if (name === "email") {
      if (!value) return "Email là bắt buộc";
      if (!emailRegex.test(value)) return "Email không hợp lệ";
      return "";
    }
    if (name === "username") {
      if (!value) return "Tên đăng nhập là bắt buộc";
      if (!usernameRegex.test(value)) return "Tên đăng nhập phải chứa 3-20 ký tự, chỉ bao gồm ký tự chữ, số và dấu gạch dưới";
      return "";
    }
    if (name === "password") {
      if (!value) return "Mật khẩu là bắt buộc";
      if (!passwordRegex.test(value)) return "Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm ký tự số và ký tự đặc biệt";
      return "";
    }
    if (name === "confirmPassword") {
      if (!value) return "Vui lòng nhập lại mật khẩu";
      if (value !== accountForm.password) return "Mật khẩu nhập lại không khớp";
      return "";
    }
    if (name === "captcha") {
      if (!value) return "Mã xác thực là bắt buộc";
      return "";
    }
    return "";
  };

  const handleAccountChange = (field, value) => {
    setAccountForm((s) => ({ ...s, [field]: value }));
    if (touched[field]) {
      setFieldErrors((errs) => ({ ...errs, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const value = field === "captcha" ? captchaAnswer : accountForm[field];
    setFieldErrors((errs) => ({ ...errs, [field]: validateField(field, value) }));
  };

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dob: null, // store as Date object
    address: "",
  });

  const [profileTouched, setProfileTouched] = useState({ fullName: false, dob: false });
  const [profileErrors, setProfileErrors] = useState({ fullName: "", dob: "" });

  const validateProfileField = (name, value) => {
    if (name === "fullName") {
      if (!value || !value.trim()) return "Họ và tên là bắt buộc";
      if (value.trim().length < 2) return "Họ và tên quá ngắn";
      return "";
    }
    if (name === "dob") {
      if (!value) return "Ngày sinh là bắt buộc";
      const d = value instanceof Date ? value : new Date(value);
      if (!d || isNaN(d.getTime())) return "Ngày sinh không hợp lệ";
      const today = new Date();
      // compare dates ignoring time
      const dNoTime = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const tNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (dNoTime > tNoTime) return "Ngày sinh không thể ở tương lai";
      return "";
    }
    return "";
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((s) => ({ ...s, [field]: value }));
    if (profileTouched[field]) {
      setProfileErrors((errs) => ({ ...errs, [field]: validateProfileField(field, value) }));
    }
  };

  const handleProfileBlur = (field) => {
    setProfileTouched((t) => ({ ...t, [field]: true }));
    setProfileErrors((errs) => ({ ...errs, [field]: validateProfileField(field, profileForm[field]) }));
  };

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ================= BƯỚC 1: CHỈ VALIDATE VÀ CHUYỂN BƯỚC =================
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    // Validate all fields and show inline errors
    const toCheck = ["email", "username", "password", "confirmPassword", "captcha"];
    const newErrors = {};
    let hasError = false;
    toCheck.forEach((f) => {
      const val = f === "captcha" ? captchaAnswer : accountForm[f];
      const err = validateField(f, val);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    setFieldErrors((s) => ({ ...s, ...newErrors }));
    setTouched((t) => ({ ...t, email: true, username: true, password: true, confirmPassword: true, captcha: true }));

    if (hasError) {
      setError("Vui lòng sửa các trường hiển thị lỗi");
      return;
    }

    // Nếu ổn thì gọi server để đăng ký (validate + tạo tài khoản), sau đó chuyển sang bước 2
    (async () => {
      setIsLoading(true);
      try {
        const res = await registerUser({
          email: accountForm.email,
          username: accountForm.username,
          password: accountForm.password,
          captchaAnswer,
          captchaToken: captcha?.token,
        });

        // Lưu token tạm thời và thông tin user để dùng cho bước 2
        const token = res.token;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", res.user.id);
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("role", res.user.role);

        setMsg("Tài khoản đã được tạo tạm thời. Vui lòng hoàn thành thông tin cá nhân.");
        setStep(2);
      } catch (err) {
        console.error(err);
        setError(err.message || "Đăng ký thất bại");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // ================= BƯỚC 2: GỌI API ĐĂNG KÝ + CẬP NHẬT PROFILE =================
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    // Validate profile fields client-side first
    const pErrors = {
      fullName: validateProfileField("fullName", profileForm.fullName),
      dob: validateProfileField("dob", profileForm.dob),
    };
    setProfileErrors((s) => ({ ...s, ...pErrors }));
    setProfileTouched((t) => ({ ...t, fullName: true, dob: true }));
    if (pErrors.fullName || pErrors.dob) {
      setError("Vui lòng sửa các trường cá nhân hiển thị lỗi");
      return;
    }

    setIsLoading(true);
    try {
      // Use token saved at step 1
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token. Vui lòng thực hiện lại bước 1.");

      // Update profile
      const profileRes = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          dateOfBirth: profileForm.dob ? new Date(profileForm.dob).toISOString() : null,
          address: profileForm.address,
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.message || "Cập nhật thông tin thất bại");
      }

      // Upload avatar if provided (uploadAvatar should use stored token or accept one)
      let finalAvatar = "";
      if (avatarFile) {
        const uploadRes = await uploadAvatar(avatarFile);
        finalAvatar = uploadRes.avatar;
        localStorage.setItem("avatar", finalAvatar);
      }

      setMsg("Đăng ký thành công! Đang vào hệ thống...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Cập nhật thông tin thất bại");
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
            <h1 className="brand-name" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
              <span style={{ color: '#000000' }}>Volunteer</span><span style={{ color: '#49BBBD' }}>Hub</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="register-content">
        <div className="form-box" style={{ border: '2px solid #49BBBD', borderRadius: '1rem', padding: '2rem' }}>
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
                  onChange={(e) => handleAccountChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={fieldErrors.email && touched.email ? "input-error" : ""}
                  required
                />
                {fieldErrors.email && touched.email && <div className="field-error">{fieldErrors.email}</div>}
              </div>
              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) => handleAccountChange("username", e.target.value)}
                  onBlur={() => handleBlur("username")}
                  className={fieldErrors.username && touched.username ? "input-error" : ""}
                  required
                />
                {fieldErrors.username && touched.username && <div className="field-error">{fieldErrors.username}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    value={accountForm.password}
                    onChange={(e) => handleAccountChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={fieldErrors.password && touched.password ? "input-error" : ""}
                    required
                  />
                  {fieldErrors.password && touched.password ? (
                    <div className="field-error">{fieldErrors.password}</div>
                  ) : (
                    <div className="field-hint">Mật khẩu ít nhất 8 ký tự, bao gồm chữ số và ký tự đặc biệt.</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Nhập lại</label>
                  <input
                    type="password"
                    value={accountForm.confirmPassword}
                    onChange={(e) => handleAccountChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={fieldErrors.confirmPassword && touched.confirmPassword ? "input-error" : ""}
                    required
                  />
                  {fieldErrors.confirmPassword && touched.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
                </div>
              </div>
              <div className="form-group captcha-group">
                <label>Mã xác thực: <span className="captcha-question">{captcha?.question || "..."}</span></label>
                <input
                  type="text"
                  placeholder="Nhập kết quả..."
                  value={captchaAnswer}
                  onChange={(e) => { setCaptchaAnswer(e.target.value); if (touched.captcha) setFieldErrors((errs) => ({ ...errs, captcha: validateField('captcha', e.target.value) })); }}
                  onBlur={() => handleBlur('captcha')}
                  className={fieldErrors.captcha && touched.captcha ? "input-error" : ""}
                  required
                />
                {fieldErrors.captcha && touched.captcha && <div className="field-error">{fieldErrors.captcha}</div>}
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
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                  onBlur={() => handleProfileBlur("fullName")}
                  className={profileErrors.fullName && profileTouched.fullName ? "input-error" : ""}
                  required
                />
                {profileErrors.fullName && profileTouched.fullName && <div className="field-error">{profileErrors.fullName}</div>}
              </div>
              <div className="form-group">
                <label>Ngày sinh</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={profileForm.dob}
                    onChange={(date) => handleProfileChange("dob", date)}
                    inputFormat="dd/MM/yyyy"
                    disableFuture
                    openTo="year"
                    views={["year", "month", "day"]}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        onBlur={() => handleProfileBlur("dob")}
                        className={profileErrors.dob && profileTouched.dob ? "input-error" : ""}
                        placeholder="dd/mm/yyyy"
                        size="small"
                      />
                    )}
                  />
                </LocalizationProvider>
                {profileErrors.dob && profileTouched.dob && <div className="field-error">{profileErrors.dob}</div>}
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