import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import { uploadAvatar } from "../../api/Users";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
  Avatar,
  IconButton,
} from "@mui/material";
import { PhotoCamera, Close } from "@mui/icons-material";

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

  // ===== STEP 1 =====
  const [accountForm, setAccountForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // ===== STEP 2 =====
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dob: "",
    address: "",
  });

  // ===== AVATAR =====
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ================= STEP 1 =================
  const handleAccountSubmit = async (e) => {

    e.preventDefault();
    setError("");
    setMsg("");

    const { email, username, password, confirmPassword } = accountForm;

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    if (!captcha || !captchaAnswer) {
      setError("Vui lòng nhập captcha");
      return;
    }

    try {
      const res = await registerUser({
        email,
        username,
        password,
        captchaAnswer,
        captchaToken: captcha.token,
      });

      // ✅ SAVE AUTH INFO
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.user.id);
      localStorage.setItem("username", res.user.username);
      localStorage.setItem("role", res.user.role);
      localStorage.setItem("avatar", res.user.avatar || "");

      setStep(2);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    }
  };

  // ================= STEP 2 =================
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!profileForm.fullName.trim()) {
      setError("Họ và tên là bắt buộc");
      return;
    }

    try {
      // 1️⃣ update profile info
      await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          dateOfBirth: profileForm.dob,
          address: profileForm.address,
        }),
      });

      // 2️⃣ upload avatar (SAME AS Profile.jsx)
      if (avatarFile) {
        const res = await uploadAvatar(avatarFile);
        localStorage.setItem("avatar", res.avatar);
      }

      setMsg("Hoàn tất đăng ký! Đang chuyển đến trang đăng nhập...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Không thể hoàn tất đăng ký");
    }
  };

  // ===== AVATAR HANDLERS =====
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" mb={3}>
          Đăng ký
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

        {/* ===== STEP 1 ===== */}
        {step === 1 && (
          <Box component="form" onSubmit={handleAccountSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={accountForm.email}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, email: e.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Tên đăng nhập"
                value={accountForm.username}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, username: e.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Mật khẩu"
                type="password"
                value={accountForm.password}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, password: e.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Nhập lại mật khẩu"
                type="password"
                value={accountForm.confirmPassword}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
                fullWidth
              />

              <TextField
                label={`Captcha: ${captcha?.question || "..."}`}
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                fullWidth
              />

              <Button type="submit" variant="contained" size="large">
                Tiếp tục
              </Button>
            </Stack>
          </Box>
        )}

        {/* ===== STEP 2 ===== */}
        {step === 2 && (
          <Box component="form" onSubmit={handleProfileSubmit}>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 64, height: 64 }}
                />
                <IconButton onClick={() => fileInputRef.current.click()}>
                  <PhotoCamera />
                </IconButton>
                {avatarPreview && (
                  <IconButton onClick={clearAvatar}>
                    <Close />
                  </IconButton>
                )}
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />

              <TextField
                label="Họ và tên"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fullName: e.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Ngày sinh"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={profileForm.dob}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, dob: e.target.value })
                }
                fullWidth
              />

              <TextField
                label="Địa chỉ"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                fullWidth
              />

              <Button type="submit" variant="contained" size="large">
                Hoàn tất
              </Button>
            </Stack>
          </Box>
        )}

        <Button
          onClick={() => navigate("/")}
          sx={{ mt: 3 }}
          color="inherit"
          fullWidth
        >
          ← Quay về trang trước
        </Button>
      </Paper>
    </Container>
  );
}
