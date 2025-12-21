import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Button,
  Box,
  Grid,
  Chip,
  Checkbox,
  Divider
} from "@mui/material";

import { 
  Email, 
  Person, 
  Cake, 
  Home, 
  CameraAlt, 
  AdminPanelSettings,
  Badge
} from "@mui/icons-material";

import { getProfile, uploadAvatar, setBadgeVisibility } from "../../api/Users";

/*
  Page: `Profile`

  Mô tả:
  - Hiển thị trang hồ sơ người dùng, bao gồm avatar, thông tin cơ bản và danh sách badge.
*/

export default function Profile() {
	const navigate = useNavigate();

  const roleLabel = {
    manager: "Quản lý",
    admin: "Quản trị viên",
    volunteer: "Tình nguyện viên",
  };
  
  const roleColor = {
    manager: "warning",
    admin: "error",
    volunteer: "success",
  };

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  

  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [manageBadges, setManageBadges] = useState(false);

  const handleToggleManageBadges = () => setManageBadges(m => !m);

  const handleToggleBadge = async (badge) => {
    try {
      const eventId = badge.eventId && badge.eventId._id ? badge.eventId._id : (badge.eventId || badge.eventId);
      const visible = !badge.visible;
      await setBadgeVisibility(eventId, visible);
      setProfile(prev => ({
        ...prev,
        badges: prev.badges.map(b => (
          (b.eventId && b.eventId.toString ? b.eventId.toString() : (b.eventId || b.eventId)) === (eventId.toString ? eventId.toString() : eventId)
            ? { ...b, visible }
            : b
        ))
      }));
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Lỗi cập nhật badge', severity: 'error' });
    }
  };


  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;


    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);
    setConfirmOpen(true);
  };


  const handleConfirmUpload = async () => {
    setConfirmOpen(false);
    setUploading(true);

    try {
      console.log("Uploading file:", pendingFile);
      const res = await uploadAvatar(pendingFile);
      console.log("Upload response:", res);
      localStorage.setItem("avatar", res.avatar);
      setProfile((prev) => ({ ...prev, avatar: res.avatar }));
      
      setSnackbar({
        open: true,
        message: "Cập nhật ảnh đại diện thành công!",
        severity: "success",
      });

      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      
      setPreviewUrl(null);
      setSnackbar({
        open: true,
        message: err.message || "Upload thất bại",
        severity: "error",
      });
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleCloseDialog = () => {
    setConfirmOpen(false);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#49BBBD' }} />
      </Box>
    );
  }

  const displayAvatar = previewUrl || (profile.avatar ? `http://localhost:5000${profile.avatar}` : "");

  const getBadgeUrl = (badgePath) => {
    if (!badgePath) return null;
    if (badgePath.startsWith("http")) return badgePath;
    if (badgePath.startsWith("data:")) return badgePath;
    const path = badgePath.startsWith("/") ? badgePath : `/${badgePath}`;
    return `http://localhost:5000${path}`;
  };

  const allBadges = Array.isArray(profile.badges) ? profile.badges : [];
  const visibleBadges = allBadges.filter(b => b.visible !== false);
  let badgesToShow = [];
  if (manageBadges) {
    badgesToShow = [...allBadges].reverse();
  } else {
    if (visibleBadges.length === allBadges.length && allBadges.length > 4) {
      badgesToShow = [...allBadges].slice(-4).reverse();
    } else {
      badgesToShow = [...visibleBadges].reverse();
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 10, mb: 5 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 4, 
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(73, 187, 189, 0.15)"
        }}
      >
        <Box 
          sx={{ 
            height: 160, 
            background: "linear-gradient(135deg, #49BBBD 0%, #359698 100%)",
            position: "relative"
          }}
        />

        <Box sx={{ px: 4, pb: 6 }}>
          <Box 
            sx={{ 
              marginTop: "-60px", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center" 
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={displayAvatar}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: "4px solid white",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  bgcolor: "#E0F2F1",
                  color: "#49BBBD"
                }}
              >
                {!displayAvatar && <Person sx={{ fontSize: 60 }} />}
              </Avatar>

              <Button
                component="label"
                disabled={uploading}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  minWidth: "auto",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "#f5f5f5",
                  border: "2px solid white",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  "&:hover": { bgcolor: "#e0e0e0" }
                }}
              >
                {uploading ? <CircularProgress size={20} /> : <CameraAlt sx={{ fontSize: 20, color: "#666" }} />}
                <input hidden type="file" accept="image/*" onChange={handleFileSelect} />
              </Button>
            </Box>

            <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, color: "#2D3436" }}>
              {profile.fullName || profile.username}
            </Typography>
            
            <Chip 
              label={roleLabel[profile.role] || profile.role} 
              color={roleColor[profile.role] || "default"} 
              size="small" 
              icon={<AdminPanelSettings />}
              sx={{ mt: 1, fontWeight: 600 }}
            />
            {badgesToShow.length > 0 && (
              <Box sx={{ mt: 4, position: 'relative', px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                    
                    {badgesToShow.map((b, idx) => {
                      const visible = b.visible !== undefined ? b.visible : true;
                      
                      if (!manageBadges && !visible) return null;

                      return (
                        <Paper 
                          key={idx} 
                          elevation={1} 
                          sx={{ width: 181, p: 1, textAlign: 'center', position: 'relative' }}
                        >
                          {manageBadges && (
                            <Checkbox
                              checked={visible}
                              onChange={() => handleToggleBadge(b)}
                              sx={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}
                            />
                          )}

                          <Box 
                            sx={{ 
                              width: '100%', 
                              height: 84, 
                              mb: 1, 
                              overflow: 'hidden', 
                              borderRadius: 1, 
                              bgcolor: '#f5f5f5', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}
                          >
                            {b.image ? (
                              <img
                                src={getBadgeUrl(b.image)}
                                alt={b.eventName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.style.display = 'none';
    
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">No image</Typography>
                            )}
                          </Box>

                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
                            {b.eventName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {b.eventEndDate ? new Date(b.eventEndDate).toLocaleDateString('vi-VN') : '—'}
                          </Typography>
                        </Paper>
                      );
                    })}

                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleToggleManageBadges}
                    sx={{
                      backgroundColor: "#49BBBD",
                      color: "white",
                      textTransform: "none",
                      fontSize: "11px",
                      padding: "2px 6px",
                      border: "none",
                      "&:hover": {
                        backgroundColor: "#359698",
                        border: "none"
                      }
                    }}
                  >
                    {manageBadges ? "Hoàn tất" : "Chỉnh sửa Badge"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "#E0F2F1", color: "#49BBBD" }}><Email /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight={500}>{profile.email}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "#E0F2F1", color: "#49BBBD" }}><Badge /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tên đăng nhập</Typography>
                  <Typography variant="body1" fontWeight={500}>{profile.username}</Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "#E0F2F1", color: "#49BBBD" }}><Cake /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ngày sinh</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {profile.dateOfBirth 
                      ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN") 
                      : "Chưa cập nhật"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "#E0F2F1", color: "#49BBBD" }}><Home /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {profile.address || "Chưa cập nhật"}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={handleCloseDialog}>
        <DialogTitle sx={{ color: "#49BBBD", fontWeight: "bold" }}>Thay đổi ảnh đại diện?</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Avatar 
              src={previewUrl} 
              sx={{ width: 100, height: 100, margin: "0 auto", border: "2px solid #49BBBD" }} 
            />
            <Typography sx={{ mt: 2 }}>Bạn có muốn sử dụng ảnh này làm avatar mới không?</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">Hủy bỏ</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmUpload} 
            sx={{ bgcolor: "#49BBBD", "&:hover": { bgcolor: "#359698" } }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}