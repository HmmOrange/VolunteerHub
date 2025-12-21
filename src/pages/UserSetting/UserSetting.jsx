import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Stack,
  Button,
  Slide,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import validators from '../../utils/validators';

import {
  getProfile,
  updateProfile,
  updateCredentials,
  changePassword,
  uploadAvatar,
} from "../../api/Users";

/* ================= HELPERS ================= */

const normalizeProfile = (data = {}) => ({
  email: data.email || "",
  username: data.username || "",
  fullName: data.fullName || "",
  dateOfBirth: data.dateOfBirth
    ? data.dateOfBirth.split("T")[0]
    : "",
  address: data.address || "",
  avatar: null,
});

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "/login";
};

export default function UserSetting() {
  const [tab, setTab] = useState(0);

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);

  // password gates
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [logoutAfterSave, setLogoutAfterSave] = useState(false);
  const [profileErrors, setProfileErrors] = useState({ fullName: '', dateOfBirth: '' });
  const [credErrors, setCredErrors] = useState({ username: '', email: '' });
  const [pwdErrors, setPwdErrors] = useState({ oldPassword: '', newPassword: '', retypePassword: '' });

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    (async () => {
      const data = await getProfile();
      const safe = normalizeProfile(data);
      setOriginal(safe);
      setForm(safe);
    })();
  }, []);

  /* ================= CHANGE DETECTION ================= */

  const isDirty = useMemo(() => {
    if (!original || !form) return false;

    const profileChanged = Object.keys(original).some(
      (k) => form[k] !== original[k]
    );

    const passwordChanged =
      confirmPassword || oldPassword || newPassword || retypePassword;

    return profileChanged || passwordChanged;
  }, [
    form,
    original,
    confirmPassword,
    oldPassword,
    newPassword,
    retypePassword,
  ]);

  /* ================= REVERT ================= */

  const revertChanges = () => {
    if (!original) return;
    setForm({ ...original });
    setConfirmPassword("");
    setOldPassword("");
    setNewPassword("");
    setRetypePassword("");
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {
      let mustLogout = false;

      // ===== TAB 0: PROFILE INFO =====
      if (tab === 0) {
        // client-side validation
        const fullNameErr = validators.isRequired(form.fullName) || (form.fullName && validators.minLength(form.fullName, 2));
        const dobErr = validators.isRequired(form.dateOfBirth) || validators.isNotFutureDate(form.dateOfBirth);
        if (fullNameErr || dobErr) {
          alert((fullNameErr ? fullNameErr + '\n' : '') + (dobErr ? dobErr : ''));
          return;
        }

        await updateProfile({
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth || null,
          address: form.address,
        });

        if (form.avatar) {
          await uploadAvatar(form.avatar);
        }
      }

      // ===== TAB 1: USERNAME / EMAIL =====
      if (tab === 1) {
        if (!confirmPassword) {
          alert("Vui lòng nhập mật khẩu xác nhận.");
          return;
        }

        await updateCredentials({
          username: form.username,
          email: form.email,
          confirmPassword,
        });

        mustLogout = true;
      }

      // ===== TAB 2: PASSWORD =====
      if (tab === 2) {
        if (!oldPassword || !newPassword || !retypePassword) {
          alert("Vui lòng nhập đầy đủ thông tin mật khẩu.");
          return;
        }

        if (newPassword !== retypePassword) {
          alert("Mật khẩu mới không khớp.");
          return;
        }

        await changePassword({ oldPassword, newPassword });
        mustLogout = true;
      }

      setLogoutAfterSave(mustLogout);
      setToastOpen(true);

      if (!mustLogout) {
        const fresh = await getProfile();
        const normalized = normalizeProfile(fresh);
        setOriginal(normalized);
        setForm(normalized);
      }

      setConfirmPassword("");
      setOldPassword("");
      setNewPassword("");
      setRetypePassword("");
    } catch (err) {
      alert(err.message);
    }
  };

  if (!form) return null;

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 6, mb: 10 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Cài đặt tài khoản
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Thông tin cá nhân" />
            <Tab label="Username & Email" />
            <Tab label="Đổi mật khẩu" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {/* TAB 0 */}
          {tab === 0 && (
            <Stack spacing={2}>
              <TextField
                label="Họ và tên"
                value={form.fullName}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, fullName: v });
                  setProfileErrors((s) => ({ ...s, fullName: validators.isRequired(v) || validators.minLength(v, 2) }));
                }}
                error={!!profileErrors.fullName}
                helperText={profileErrors.fullName || ''}
                fullWidth
              />

              <TextField
                label="Ngày sinh"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.dateOfBirth}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, dateOfBirth: v });
                  setProfileErrors((s) => ({ ...s, dateOfBirth: validators.isRequired(v) || validators.isNotFutureDate(v) }));
                }}
                error={!!profileErrors.dateOfBirth}
                helperText={profileErrors.dateOfBirth || ''}
                fullWidth
              />

              <TextField
                label="Địa chỉ"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                fullWidth
              />

              <Button variant="outlined" component="label">
                Chọn ảnh đại diện
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, avatar: e.target.files[0] })
                  }
                />
              </Button>
            </Stack>
          )}

          {/* TAB 1 */}
          {tab === 1 && (
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={form.username}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, username: v });
                  setCredErrors((s) => ({ ...s, username: validators.isRequired(v) || validators.isUsername(v) }));
                }}
                error={!!credErrors.username}
                helperText={credErrors.username || ''}
                fullWidth
              />

              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, email: v });
                  setCredErrors((s) => ({ ...s, email: validators.isRequired(v) || validators.isEmail(v) }));
                }}
                error={!!credErrors.email}
                helperText={credErrors.email || ''}
                fullWidth
              />

              <Divider />

              <TextField
                label="Mật khẩu xác nhận"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
              />
            </Stack>
          )}

          {/* TAB 2 */}
          {tab === 2 && (
            <Stack spacing={2}>
              <TextField
                label="Mật khẩu cũ"
                type="password"
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); setPwdErrors((s) => ({ ...s, oldPassword: validators.isRequired(e.target.value) })); }}
                error={!!pwdErrors.oldPassword}
                helperText={pwdErrors.oldPassword || ''}
                fullWidth
              />

              <TextField
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwdErrors((s) => ({ ...s, newPassword: validators.isRequired(e.target.value) || validators.isStrongPassword(e.target.value) })); }}
                error={!!pwdErrors.newPassword}
                helperText={pwdErrors.newPassword || ''}
                fullWidth
              />

              <TextField
                label="Nhập lại mật khẩu mới"
                type="password"
                value={retypePassword}
                onChange={(e) => { setRetypePassword(e.target.value); setPwdErrors((s) => ({ ...s, retypePassword: e.target.value !== newPassword ? 'Mật khẩu không khớp' : '' })); }}
                error={!!pwdErrors.retypePassword}
                helperText={pwdErrors.retypePassword || ''}
                fullWidth
              />
            </Stack>
          )}
        </Paper>

        {/* SAVE BAR */}
        <Slide direction="up" in={isDirty} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "#fff",
              borderTop: "1px solid #ddd",
              p: 2,
              zIndex: 1200,
            }}
          >
            <Container maxWidth="sm">
              <Stack direction="row" justifyContent="space-between">
                <Typography>Bạn có thay đổi chưa lưu</Typography>
                <Stack direction="row" spacing={1}>
                  <Button onClick={revertChanges}>Hoàn tác</Button>
                  <Button variant="contained" onClick={handleSave}>
                    Lưu thay đổi
                  </Button>
                </Stack>
              </Stack>
            </Container>
          </Box>
        </Slide>
      </Container>

      {/* TOAST */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => {
          setToastOpen(false);
          if (logoutAfterSave) logout();
        }}
      >
        <Alert severity="success" variant="filled">
          Lưu thành công. Vui lòng đăng nhập lại.
        </Alert>
      </Snackbar>
    </>
  );
}
