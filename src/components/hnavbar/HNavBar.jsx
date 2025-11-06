import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
} from "@mui/material";

export default function HNavbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      color="primary"
      elevation={3}
      sx={{ px: { xs: 2, sm: 4 } }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left side (title/logo) */}
        <Typography
          variant="h6"
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            userSelect: "none",
          }}
          onClick={() => navigate("/dashboard")}
        >
          VolunteerHub
        </Typography>

        {/* Right side (buttons) */}
        <Stack direction="row" spacing={2} alignItems="center">
          {username ? (
            <>
              {role === "manager" && (
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={() => navigate("/event/create")}
                >
                  Tạo sự kiện
                </Button>
              )}
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Xin chào, {username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
