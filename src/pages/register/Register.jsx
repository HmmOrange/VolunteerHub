import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/Auth";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
} from "@mui/material";

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

  // ===== STEP 1: ACCOUNT =====
  const [accountForm, setAccountForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // ===== STEP 2: PROFILE =====
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dob: "",
    address: "",
    avatar: "",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // ================= STEP 1 SUBMIT =================
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

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
      await registerUser({
        email,
        username,
        password,
        captchaAnswer,
        captchaToken: captcha.token,
      });

      setStep(2);
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setError(err.message || "Đăng ký thất bại");
    }
  };

  // ================= STEP 2 SUBMIT =================
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!profileForm.fullName.trim()) {
      setError("Họ và tên là bắt buộc");
      return;
    }

    // Backend chưa xử lý → log tạm
    console.log("PROFILE INFO:", profileForm);

    setMsg("Hoàn tất đăng ký! Đang chuyển đến trang đăng nhập...");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" mb={3}>
          Đăng ký
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {msg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}

        {/* ================= STEP 1 ================= */}
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

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <Box component="form" onSubmit={handleProfileSubmit}>
            <Stack spacing={2}>
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

              <TextField
                label="Ảnh đại diện (URL)"
                value={profileForm.avatar}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, avatar: e.target.value })
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
