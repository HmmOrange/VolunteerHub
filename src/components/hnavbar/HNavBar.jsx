import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Badge,
  Divider,
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

  // Lấy thông tin từ LocalStorage
  const userId = localStorage.getItem("_id"); 
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role")?.toLowerCase(); 
  const avatar = localStorage.getItem("avatar");
  const token = localStorage.getItem("token"); // Lấy token

  // --- STATE CHO MENU PROFILE ---
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const isProfileMenuOpen = Boolean(anchorElProfile);

  // --- STATE CHO MENU THÔNG BÁO ---
  const [anchorElNoti, setAnchorElNoti] = useState(null);
  const isNotiMenuOpen = Boolean(anchorElNoti);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // === FETCH THÔNG BÁO ===
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      // Dùng fetch hoặc axios đều được, ở đây giữ axios như code gốc của bạn
      // Nhưng lưu ý header Authorization nếu backend yêu cầu
      const res = await axios.get(`http://localhost:5000/api/notifications/${userId}`, {
         headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // const interval = setInterval(fetchNotifications, 60000);
    // return () => clearInterval(interval);
  }, [userId]);

  // === LOGIC MÀU ROLE ===
  const getRoleColor = () => {
    switch (role) {
      case "admin": return "#d32f2f";
      case "manager": return "#49BBBD";
      default: return "#9e9e9e";
    }
  };

  // === HANDLERS PROFILE ===
  const handleProfileMenuOpen = (event) => setAnchorElProfile(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorElProfile(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    localStorage.clear();
    navigate("/");
  };

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate("/profile");
  };

  const handleAddEvent = () => navigate("/event/create");
  
  const handleUserList = () => {
    handleProfileMenuClose();
    navigate("/admin/users");
  };

  // === HANDLERS THÔNG BÁO ===
  const handleNotiIconClick = (event) => {
    setAnchorElNoti(event.currentTarget);
    fetchNotifications();
  };

  const handleNotiMenuClose = () => setAnchorElNoti(null);

  // === LOGIC CLICK THÔNG BÁO (ĐÃ SỬA GỌN) ===
  const handleNotificationClick = async (noti) => {
    try {
      console.log("🔔 Click Notification:", noti);
      
      // 1. Đánh dấu đã đọc
      if (!noti.isRead) {
        await fetch(`http://localhost:5000/api/notifications/${noti._id}/read`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        
        setNotifications((prev) =>
          prev.map((n) => (n._id === noti._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // 2. XỬ LÝ NAVIGATE AN TOÀN
      // Backend có thể gửi relatedId dưới dạng Object (đã populate) hoặc String
      let targetId = noti.relatedId;
      
      // Nếu là Object, lấy _id ra
      if (targetId && typeof targetId === 'object') {
          targetId = targetId._id;
      }

      if (targetId) {
          // Bất kể là Comment hay Post hay Event, giờ chúng ta đều đã lưu ID của Event
          // Hoặc relatedModel là "Event"
          navigate(`/event/${targetId}`);
      } else {
          alert("Sự kiện này không còn tồn tại.");
      }
      
      handleNotiMenuClose();
    } catch (err) {
      console.error("Lỗi handleNotificationClick:", err);
    }
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
            style={{ cursor: "pointer" }}
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
          
          {role === "manager" && (
            <IconButton
              className="hnavbar-icon-btn hnavbar-add-btn"
              onClick={handleAddEvent}
            >
              <AddIcon />
            </IconButton>
          )}

          {/* --- NÚT CHUÔNG THÔNG BÁO --- */}
          <IconButton
            className="hnavbar-icon-btn"
            onClick={handleNotiIconClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <BellIcon />
            </Badge>
          </IconButton>

          {/* --- AVATAR --- */}
          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            className="hnavbar-avatar-btn"
          >
            <Avatar
              className="hnavbar-avatar"
              src={avatar ? `http://localhost:5000${avatar}` : undefined}
              sx={{
                bgcolor: avatar ? "transparent" : getRoleColor(),
              }}
            >
              {!avatar && username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Stack>

        {/* ===== MENU THÔNG BÁO (DROPDOWN) ===== */}
        <Menu
          anchorEl={anchorElNoti}
          open={isNotiMenuOpen}
          onClose={handleNotiMenuClose}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: 350,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
            <Typography variant="subtitle1" sx={{ p: 2, fontWeight: 'bold' }}>
                Thông báo
            </Typography>
            <Divider />
            
            {notifications.length === 0 ? (
                <MenuItem disabled>Không có thông báo nào</MenuItem>
            ) : (
                notifications.map((noti) => (
                    <MenuItem 
                        key={noti._id} 
                        onClick={() => handleNotificationClick(noti)}
                        sx={{
                            whiteSpace: 'normal', 
                            backgroundColor: noti.isRead ? 'inherit' : '#e3f2fd', 
                            borderBottom: '1px solid #f0f0f0'
                        }}
                    >
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: noti.isRead ? 'normal' : 'bold' }}>
                                {noti.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(noti.createdAt).toLocaleString('vi-VN')}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))
            )}
        </Menu>

        {/* ===== MENU PROFILE ===== */}
        <Menu
          anchorEl={anchorElProfile}
          open={isProfileMenuOpen}
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