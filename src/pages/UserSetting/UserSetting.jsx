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
  Avatar,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
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

/*
  Page: `UserSetting`

  Mô tả:
  - Trang quản lý thông tin người dùng cá nhân gồm các tab: Profile, Username/Email, Password.
  - Chức năng chính: tải profile (`getProfile`), cập nhật profile (`updateProfile`), cập nhật thông tin đăng nhập (`updateCredentials`), đổi mật khẩu (`changePassword`), upload avatar (`uploadAvatar`).
  - Có validate phía client và hiển thị dialog/alert khi cần.
*/

export default function UserSetting() {
  const [tab, setTab] = useState(0);

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // password gates
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [logoutAfterSave, setLogoutAfterSave] = useState(false);
  
  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: '', message: '', severity: 'error' });
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
      if (data.avatar) {
        setAvatarPreview(`http://localhost:5000${data.avatar}`);
      }
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
    setAvatarPreview(null);
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
          setDialogContent({
            title: 'Lỗi xác thực',
            message: (fullNameErr ? fullNameErr + '\n' : '') + (dobErr ? dobErr : ''),
            severity: 'error'
          });
          setDialogOpen(true);
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
          setDialogContent({
            title: 'Thiếu thông tin',
            message: 'Vui lòng nhập mật khẩu xác nhận.',
            severity: 'warning'
          });
          setDialogOpen(true);
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
          setDialogContent({
            title: 'Thiếu thông tin',
            message: 'Vui lòng nhập đầy đủ thông tin mật khẩu.',
            severity: 'warning'
          });
          setDialogOpen(true);
          return;
        }

        if (newPassword !== retypePassword) {
          setDialogContent({
            title: 'Lỗi xác thực',
            message: 'Mật khẩu mới không khớp.',
            severity: 'error'
          });
          setDialogOpen(true);
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
      setDialogContent({
        title: 'Lỗi',
        message: err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        severity: 'error'
      });
      setDialogOpen(true);
    }
  };

  if (!form) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
        {/* Header Card */}
        <Card 
          sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, #49BBBD 0%, #3a9a9c 100%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar
                src={avatarPreview}
                sx={{ 
                  width: 100, 
                  height: 100,
                  border: '4px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <PersonIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {form.fullName || 'Chưa có tên'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  @{form.username || 'username'}
                </Typography>
                <Chip 
                  label={form.email || 'email@example.com'} 
                  size="small"
                  sx={{ 
                    mt: 1,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Paper 
          elevation={3}
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f1f4f7' }}>
            <Tabs 
              value={tab} 
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2.5,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            >
              <Tab 
                icon={<PersonIcon />} 
                iconPosition="start"
                label="Thông tin cá nhân" 
              />
              <Tab 
                icon={<EmailIcon />} 
                iconPosition="start"
                label="Username & Email" 
              />
              <Tab 
                icon={<LockIcon />} 
                iconPosition="start"
                label="Đổi mật khẩu" 
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* TAB 0 */}
            {tab === 0 && (
              <Stack spacing={3}>
                {/* Avatar Upload Section */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={avatarPreview}
                      sx={{ 
                        width: 120, 
                        height: 120,
                        mx: 'auto',
                        mb: 2,
                        border: '4px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        right: -5,
                        bgcolor: '#49BBBD',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#3a9a9c',
                        },
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <PhotoCameraIcon />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Nhấp vào icon camera để thay đổi ảnh đại diện
                  </Typography>
                </Box>

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
                  variant="outlined"
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
                  variant="outlined"
                />

                <TextField
                  label="Địa chỉ"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Stack>
            )}

            {/* TAB 1 */}
            {tab === 1 && (
              <Stack spacing={3}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Thay đổi username hoặc email sẽ yêu cầu bạn đăng nhập lại
                </Alert>

                <TextField
                  label="Username"
                  value={form.username}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, username: v });
                    setCredErrors((s) => ({ ...s, username: validators.isRequired(v) || validators.isUsername(v) }));
                  }}
                  error={!!credErrors.username}
                  helperText={credErrors.username || 'Username dùng để đăng nhập'}
                  fullWidth
                  variant="outlined"
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
                  helperText={credErrors.email || 'Email liên hệ của bạn'}
                  fullWidth
                  variant="outlined"
                />

                <Divider sx={{ my: 2 }} />

                <TextField
                  label="Mật khẩu xác nhận"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  helperText="Nhập mật khẩu hiện tại để xác nhận thay đổi"
                />
              </Stack>
            )}

          {/* TAB 2 */}
          {tab === 2 && (
            <Stack spacing={3}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Đổi mật khẩu sẽ yêu cầu bạn đăng nhập lại
              </Alert>

              <TextField
                label="Mật khẩu cũ"
                type="password"
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); setPwdErrors((s) => ({ ...s, oldPassword: validators.isRequired(e.target.value) })); }}
                error={!!pwdErrors.oldPassword}
                helperText={pwdErrors.oldPassword || 'Nhập mật khẩu hiện tại của bạn'}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwdErrors((s) => ({ ...s, newPassword: validators.isRequired(e.target.value) || validators.isStrongPassword(e.target.value) })); }}
                error={!!pwdErrors.newPassword}
                helperText={pwdErrors.newPassword || 'Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số'}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="Nhập lại mật khẩu mới"
                type="password"
                value={retypePassword}
                onChange={(e) => { setRetypePassword(e.target.value); setPwdErrors((s) => ({ ...s, retypePassword: e.target.value !== newPassword ? 'Mật khẩu không khớp' : '' })); }}
                error={!!pwdErrors.retypePassword}
                helperText={pwdErrors.retypePassword || 'Xác nhận mật khẩu mới'}
                fullWidth
                variant="outlined"
              />
            </Stack>
          )}
          </Box>
        </Paper>

        {/* SAVE BAR */}
        <Slide direction="up" in={isDirty} mountOnEnter unmountOnExit>
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "#fff",
              borderTop: "3px solid #49BBBD",
              p: 2.5,
              zIndex: 1200,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Container maxWidth="md">
              <Stack 
                direction="row" 
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="body1" fontWeight="600" color="primary">
                    Bạn có thay đổi chưa lưu
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nhớ lưu thay đổi trước khi rời khỏi trang
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button 
                    onClick={revertChanges}
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                    }}
                  >
                    Hoàn tác
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSave}
                    startIcon={<SaveIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                      background: 'linear-gradient(135deg, #49BBBD 0%, #3a9a9c 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #3a9a9c 0%, #2d7b7d 100%)',
                      },
                    }}
                  >
                    Lưu thay đổi
                  </Button>
                </Stack>
              </Stack>
            </Container>
          </Paper>
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          Lưu thành công. {logoutAfterSave ? 'Vui lòng đăng nhập lại.' : ''}
        </Alert>
      </Snackbar>

      {/* DIALOG POPUP */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {dialogContent.severity === 'error' && (
            <ErrorIcon color="error" sx={{ fontSize: 28 }} />
          )}
          {dialogContent.severity === 'warning' && (
            <WarningIcon color="warning" sx={{ fontSize: 28 }} />
          )}
          <Typography variant="h6" component="span" fontWeight="600">
            {dialogContent.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
            {dialogContent.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 4,
              background: dialogContent.severity === 'error' 
                ? 'linear-gradient(135deg, #f5576c 0%, #d94452 100%)'
                : 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
              '&:hover': {
                background: dialogContent.severity === 'error'
                  ? 'linear-gradient(135deg, #e4465b 0%, #c83341 100%)'
                  : 'linear-gradient(135deg, #ff9615 0%, #ea7b00 100%)',
              },
            }}
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
