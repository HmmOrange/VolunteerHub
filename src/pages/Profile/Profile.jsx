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

// Import các Icon đẹp mắt
import { 
  Email, 
  Person, 
  Cake, 
  Home, 
  CameraAlt, 
  AdminPanelSettings,
  Badge
} from "@mui/icons-material";
// Removed IconButton/MoreVert imports; using a centered Button for badge editing

import { getProfile, uploadAvatar, setBadgeVisibility } from "../../api/Users";

export default function Profile() {
<<<<<<< HEAD
	const navigate = useNavigate();
	const roleLabel = {
		manager: "Quản lý",
		admin: "Admin",
		volunteer: "Thành viên",
	};
	const [profile, setProfile] = useState(null);
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState(null);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
=======
  // Label và màu sắc cho các Role
  const roleLabel = {
    manager: "Quản lý",
    admin: "Quản trị viên",
    volunteer: "Tình nguyện viên",
  };
  
  const roleColor = {
    manager: "warning",
    admin: "error",
    volunteer: "success", // Màu xanh lá cho tình nguyện viên
  };
>>>>>>> fdf9d341f67f54799accd0efc9559e9e014fea35

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // State xử lý file
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // URL ảnh xem trước

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
      // update local state
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

  // --- 1. LẤY THÔNG TIN PROFILE ---
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  // --- 2. KHI CHỌN FILE (CHƯA UPLOAD) ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Tạo preview để hiện lên UI ngay lập tức
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);
    setConfirmOpen(true);
  };

  // --- 3. XÁC NHẬN UPLOAD (GỌI API) ---
  const handleConfirmUpload = async () => {
    setConfirmOpen(false);
    setUploading(true);

    try {
      console.log("Uploading file:", pendingFile);
      
      // Gọi API upload
      const res = await uploadAvatar(pendingFile);
      console.log("Upload response:", res);

      // Cập nhật LocalStorage
      localStorage.setItem("avatar", res.avatar);

      // QUAN TRỌNG: Cập nhật State ngay lập tức (Không cần reload trang)
      setProfile((prev) => ({ ...prev, avatar: res.avatar }));
      
      setSnackbar({
        open: true,
        message: "Cập nhật ảnh đại diện thành công!",
        severity: "success",
      });

      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      
      // Nếu lỗi, reset preview về null để hiện lại ảnh cũ
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

  // Hủy bỏ chọn ảnh
  const handleCloseDialog = () => {
    setConfirmOpen(false);
    setPendingFile(null);
    setPreviewUrl(null); // Xóa preview
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

  // Logic hiển thị ảnh: Ưu tiên ảnh Preview -> Ảnh từ Server -> Mặc định
  const displayAvatar = previewUrl || (profile.avatar ? `http://localhost:5000${profile.avatar}` : "");

  // Prepare badges per rules:
  // - manage mode: show all earned badges (level >=3)
  // - otherwise: show badges with visible !== false; if user hasn't customized (all visible) and >4, show 4 most recent
  const allEarnedBadges = Array.isArray(profile.badges) ? profile.badges.filter(b => (b.level || 0) >= 3) : [];
  const visibleBadges = allEarnedBadges.filter(b => b.visible !== false);
  let badgesToShow = [];
  if (manageBadges) {
    badgesToShow = [...allEarnedBadges].reverse();
  } else {
    // if user hasn't customized (all badges are visible) and there are more than 4, show 4 most recent
    if (visibleBadges.length === allEarnedBadges.length && allEarnedBadges.length > 4) {
      badgesToShow = [...allEarnedBadges].slice(-4).reverse();
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
          boxShadow: "0 10px 30px rgba(73, 187, 189, 0.15)" // Bóng màu xanh ngọc nhạt
        }}
      >
        {/* --- COVER IMAGE (MÀU CHỦ ĐẠO) --- */}
        <Box 
          sx={{ 
            height: 160, 
            background: "linear-gradient(135deg, #49BBBD 0%, #359698 100%)",
            position: "relative"
          }}
        />

        <Box sx={{ px: 4, pb: 6 }}>
          {/* --- AVATAR SECTION (ĐÈ LÊN COVER) --- */}
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

              {/* Nút Camera nhỏ để đổi ảnh */}
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
            {/* Badges: allow managing visibility */}
            {badgesToShow.length > 0 && (
              <Box sx={{ mt: 4, position: 'relative', px: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                    {badgesToShow.map((b, idx) => {
                    const getBadgeUrl = (img) => {
                      if (!img) return null;
                      if (img.startsWith('http')) return img;
                      const path = img.startsWith('/') ? img : `/${img}`;
                      return `http://localhost:5000${path}`;
                    };
                    const visible = b.visible !== undefined ? b.visible : true;
                    // When not managing we already filtered visible badges; when managing show all
                    if (!manageBadges && !visible) return null;
                    return (
                      <Paper key={idx} elevation={1} sx={{ width: 181, p: 1, textAlign: 'center', position: 'relative' }}>
                        {manageBadges && (
                          <Checkbox
                            checked={visible}
                            onChange={() => handleToggleBadge(b)}
                            sx={{ position: 'absolute', top: 4, right: 4 }}
                          />
                        )}
                        <Box sx={{ width: '100%', height: 84, mb: 1, overflow: 'hidden', borderRadius: 1, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {b.image ? (
                            <img src={getBadgeUrl(b.image)} alt={b.eventName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">No image</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>{b.eventName}</Typography>
                        <Typography variant="caption" color="text.secondary">Đóng góp {b.level}/5</Typography>
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
                      textTransform: "none",   // ❌ bỏ viết hoa
                      fontSize: "11px",        // 🔽 chữ nhỏ hơn nữa
                      padding: "2px 6px"       // 🔽 thu nhỏ button
                    }}
                  >
                    Chỉnh sửa Badge
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

<<<<<<< HEAD
			<Typography>
				<b>Vai trò:</b> {roleLabel[profile.role] || profile.role}
			</Typography>
        </Stack>
		<Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
			<Button
				variant="contained"
				onClick={() => navigate("/profile/edit")}
			>
				Chỉnh sửa thông tin
			</Button>
		</Stack>

=======
          {/* --- THÔNG TIN CHI TIẾT --- */}
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
>>>>>>> fdf9d341f67f54799accd0efc9559e9e014fea35
      </Paper>

      {/* --- DIALOG XÁC NHẬN --- */}
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

      {/* --- SNACKBAR --- */}
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