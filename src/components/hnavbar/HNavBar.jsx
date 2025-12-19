import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Box, Stack, IconButton,
  InputBase, Avatar, Menu, MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon, Search as SearchIcon, Add as AddIcon,
  NotificationsNoneOutlined as BellIcon,
} from "@mui/icons-material";

import "./HNavBar.css";

// Chỉ nhận 'onToggleVNavBar'
export default function HNavbar({ onToggleVNavBar }) { 
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role")?.toLowerCase(); // Lấy role và chuyển về chữ thường
  const avatar = localStorage.getItem("avatar"); 

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // === LOGIC XÁC ĐỊNH MÀU NỀN THEO ROLE ===
  const getRoleColor = () => {
    switch (role) {
      case "admin":
        return "#d32f2f"; // Đỏ cho Admin
      case "manager":
        return "#49BBBD"; // Teal cho Manager
      default:
        return "#9e9e9e"; // Xám cho người dùng/tình nguyện viên bình thường
    }
  };

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    localStorage.clear();
    navigate("/");
  };

  const handleProfile = () => {
    handleProfileMenuClose();
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
    <AppBar
      elevation={0}
      position="fixed" 
      className="hnavbar-appbar"
    >
      <Toolbar className="hnavbar-toolbar">
        {/* === 1. BÊN TRÁI === */}
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

        {/* === 2. GIỮA === */}
        <Box className="hnavbar-search">
          <SearchIcon className="hnavbar-search-icon" />
          <InputBase
            placeholder="Search"
            fullWidth
            className="hnavbar-search-input"
          />
        </Box>

        {/* === 3. BÊN PHẢI === */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            className="hnavbar-icon-btn hnavbar-add-btn"
            onClick={handleAddEvent}
          >
            <AddIcon />
          </IconButton>
          <IconButton className="hnavbar-icon-btn" onClick={handleNotifications}>
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
              sx={{ 
                // SỬA TẠI ĐÂY: Nếu có avatar thì transparent, không có thì lấy màu theo role
                bgcolor: avatar ? 'transparent' : getRoleColor() 
              }}
            >
              {!avatar && username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Stack>

        {/* Menu Avatar */}
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

          {/* === HIỂN THỊ CÓ ĐIỀU KIỆN === */}
          {role === 'admin' && (
            <MenuItem onClick={handleUserList}>Danh sách người dùng</MenuItem>
          )}

          <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}