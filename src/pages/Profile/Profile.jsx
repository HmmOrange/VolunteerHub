import { useEffect, useState } from "react";
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
} from "@mui/material";
import { getProfile } from "../../api/Users";
import { uploadAvatar } from "../../api/Users";
import { Button } from "@mui/material";

export default function Profile() {
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

	const handleConfirmUpload = async () => {
		setConfirmOpen(false);
		setUploading(true);

		try {
			const res = await uploadAvatar(pendingFile);

			localStorage.setItem("avatar", res.avatar);

			setSnackbar({
				open: true,
				message: "Cập nhật ảnh đại diện thành công! Trang sẽ được tải lại.",
				severity: "success",
			});

			setTimeout(() => {
				window.location.reload();
			}, 1200);
		} catch (err) {
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

  const handleAvatarUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setPendingFile(file);
		setConfirmOpen(true);
	};

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Thông tin cá nhân
        </Typography>
				<Stack spacing={2} alignItems="center">
					<Avatar
						src={profile.avatar ? `http://localhost:5000${profile.avatar}` : ""}
						sx={{ width: 100, height: 100 }}
					/>

					<Button variant="outlined" component="label" disabled={uploading}>
						{uploading ? "Đang upload..." : "Đổi ảnh đại diện"}
						<input hidden type="file" accept="image/*" onChange={handleAvatarUpload} />
					</Button>
				</Stack>

        <Stack spacing={1.5}>
          <Typography>
            <b>Email:</b> {profile.email}
          </Typography>

          <Typography>
            <b>Tên đăng nhập:</b> {profile.username}
          </Typography>

          <Typography>
            <b>Họ và tên:</b> {profile.fullName}
          </Typography>

          {profile.dateOfBirth && (
            <Typography>
              <b>Ngày sinh:</b>{" "}
              {new Date(profile.dateOfBirth).toLocaleDateString()}
            </Typography>
          )}

          {profile.address && (
            <Typography>
              <b>Địa chỉ:</b> {profile.address}
            </Typography>
          )}

          <Typography>
            <b>Vai trò:</b> {profile.role}
          </Typography>
        </Stack>
      </Paper>
			<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
				<DialogTitle>Xác nhận</DialogTitle>
				<DialogContent>
					Bạn có chắc chắn muốn cập nhật ảnh đại diện không?
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
					<Button variant="contained" onClick={handleConfirmUpload}>
						Xác nhận
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert severity={snackbar.severity} variant="filled">
					{snackbar.message}
				</Alert>
			</Snackbar>

    </Container>
  );
}
