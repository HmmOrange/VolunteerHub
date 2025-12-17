import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getProfile } from "../../api/Users";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

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
    </Container>
  );
}
