import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  IconButton,
  InputBase,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  NotificationsNoneOutlined as BellIcon,
} from "@mui/icons-material";

import "./HNavBar.css";

export default function HNavbar({ onToggleVNavBar }) {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role");
  const avatar = localStorage.getItem("avatar"); // 👈 NEW

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    localStorage.clear();
    navigate("/");
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate("/profile");
  };

  const handleAddEvent = () => {
    navigate("/event/create");
  };

  const handleUserList = () => {
    handleProfileMenuClose();
    navigate("/admin/users");
  };

  const handleNotifications = () => {
    console.log("Show Notifications");
  };

  return (
    <AppBar elevation={0} position="fixed" className="hnavbar-appbar">
      <Toolbar className="hnavbar-toolbar">
        {/* ===== LEFT ===== */}
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            edge="start"
            aria-label="open drawer"
            onClick={onToggleVNavBar}
            className="hnavbar-icon-btn"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            className="hnavbar-logo"
            onClick={() => navigate("/dashboard")}
          >
            <span className="hnavbar-logo-main">Volunteer</span>
            <span className="hnavbar-logo-hub">Hub</span>
          </Typography>
        </Stack>

        {/* ===== CENTER ===== */}
        <Box className="hnavbar-search">
          <SearchIcon className="hnavbar-search-icon" />
          <InputBase
            placeholder="Search"
            fullWidth
            className="hnavbar-search-input"
          />
        </Box>

        {/* ===== RIGHT ===== */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            className="hnavbar-icon-btn hnavbar-add-btn"
            onClick={handleAddEvent}
          >
            <AddIcon />
          </IconButton>

          <IconButton
            className="hnavbar-icon-btn"
            onClick={handleNotifications}
          >
            <BellIcon />
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            className="hnavbar-avatar-btn"
          >
            <Avatar
              className="hnavbar-avatar"
              src={avatar ? `http://localhost:5000${avatar}` : undefined}
            >
              {!avatar && username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Stack>

        {/* ===== AVATAR MENU ===== */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleProfileMenuClose}
          PaperProps={{ className: "hnavbar-menu-paper" }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem disabled className="hnavbar-menu-user">
            Xin chào, {username}
          </MenuItem>

          <MenuItem onClick={handleProfile}>Thông tin cá nhân</MenuItem>

          {role === "admin" && (
            <MenuItem onClick={handleUserList}>
              Danh sách người dùng
            </MenuItem>
          )}

          <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
