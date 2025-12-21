import { useState, useEffect, useRef } from "react";
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
  Badge,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ClickAwayListener,
  ListItemAvatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  NotificationsNoneOutlined as BellIcon,
} from "@mui/icons-material";
import Fuse from "fuse.js";
import { searchEvents } from "../../api/Events";
import placeholderImage from "../../assets/img/event_group.jpg";

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

  // --- STATE CHO SEARCH ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchInputRef = useRef(null);

  // Helper function để render banner URL
  const getBannerUrl = (banner) => {
    if (!banner) return placeholderImage;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner;
    const path = banner.startsWith("/") ? banner : `/${banner}`;
    return `http://localhost:5000${path}`;
  };

  // === FETCH THÔNG BÁO (ĐÃ SỬA DÙNG FETCH) ===
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        throw new Error("Không thể tải thông báo");
      }

      const data = await res.json();
      
      // Axios trả về res.data, còn Fetch trả về json object trực tiếp
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    }
  };

  // === FETCH EVENTS CHO SEARCH ===
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await searchEvents("");
        console.log("Loaded events for search:", events);
        setAllEvents(events);
      } catch (err) {
        console.error("Lỗi tải events:", err);
      }
    };
    loadEvents();
  }, []);

  // === LOAD SEARCH HISTORY ===
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(history);
  }, []);

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

  const handleEditSettings = () => {
    handleProfileMenuClose();
    navigate("/profile/edit");
  }

  const handleAddEvent = () => navigate("/event/create");
  
  const handleUserList = () => {
    handleProfileMenuClose();
    navigate("/admin/users");
  };

  // === HANDLERS SEARCH ===
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    console.log("Searching with allEvents:", allEvents.length);
    
    // Fuzzy search với Fuse.js (threshold 0.25 = ~75% match)
    const fuse = new Fuse(allEvents, {
      keys: ["name"],
      threshold: 0.25,
      includeScore: true,
    });

    const results = fuse.search(query).map(result => result.item);
    console.log("Search results:", results);
    setSearchResults(results.slice(0, 5)); // Giới hạn 5 kết quả
    setShowSearchDropdown(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;

    // Lưu vào search history
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, 10);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    setSearchHistory(newHistory);

    // Navigate đến trang search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  const handleSearchResultClick = (slug) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/event/${slug}`);
  };

  const handleClickAway = () => {
    setShowSearchDropdown(false);
  };

  // === HANDLERS THÔNG BÁO ===
  const handleNotiIconClick = (event) => {
    setAnchorElNoti(event.currentTarget);
    fetchNotifications();
  };

  const handleNotiMenuClose = () => setAnchorElNoti(null);

  // === LOGIC CLICK THÔNG BÁO ===
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
      if (noti.type === "EVENT_PENDING_APPROVAL") {
        // Điều hướng đến trang danh sách chờ duyệt của Admin
        // (Bạn thay đường dẫn này khớp với route trong App.js của bạn, ví dụ: /admin/dashboard hoặc /admin/pending)
        navigate("/admin/events"); 
        handleNotiMenuClose();
        return; // Dừng hàm luôn, không chạy logic bên dưới
      }

      let targetId = noti.relatedId;
      
      if (targetId && typeof targetId === 'object') {
          targetId = targetId._id;
      }

      if (targetId) {
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
        <Box className="hnavbar-search" style={{ position: 'relative' }}>
          <ClickAwayListener onClickAway={handleClickAway}>
            <form onSubmit={handleSearchSubmit} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <SearchIcon className="hnavbar-search-icon" />
              <InputBase
                ref={searchInputRef}
                placeholder="Tìm kiếm sự kiện..."
                fullWidth
                className="hnavbar-search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim() !== "") {
                    setShowSearchDropdown(true);
                  }
                }}
              />
              
              {/* Dropdown autocomplete */}
              {showSearchDropdown && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    zIndex: 1300,
                  }}
                >
                  <List>
                    {searchResults.length > 0 ? (
                      <>
                        <ListItem sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                          <ListItemText primary="Kết quả tìm kiếm" primaryTypographyProps={{ variant: 'subtitle2' }} />
                        </ListItem>
                        {searchResults.map((event) => (
                          <ListItem
                            key={event._id}
                            button
                            onClick={() => handleSearchResultClick(event.slug)}
                            sx={{
                              '&:hover': {
                                bgcolor: '#e3f2fd',
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                variant="rounded"
                                src={getBannerUrl(event.banner)}
                                alt={event.name}
                                sx={{ 
                                  width: 56, 
                                  height: 56, 
                                  mr: 1
                                }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={event.name}
                              secondary={`${new Date(event.date).toLocaleDateString('vi-VN')} - ${event.location}`}
                            />
                          </ListItem>
                        ))}
                        <Divider />
                        <ListItem
                          button
                          onClick={handleSearchSubmit}
                          sx={{
                            bgcolor: '#fafafa',
                            '&:hover': {
                              bgcolor: '#e3f2fd',
                            },
                          }}
                        >
                          <ListItemText
                            primary={`Xem tất cả kết quả cho "${searchQuery}"`}
                            primaryTypographyProps={{ fontWeight: 'bold', color: 'primary' }}
                          />
                        </ListItem>
                      </>
                    ) : searchHistory.length > 0 ? (
                      <>
                        <ListItem sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                          <ListItemText primary="Tìm kiếm gần đây" primaryTypographyProps={{ variant: 'subtitle2' }} />
                        </ListItem>
                        {searchHistory.slice(0, 5).map((historyItem, index) => (
                          <ListItem
                            key={index}
                            button
                            onClick={() => {
                              setSearchQuery(historyItem);
                              handleSearchChange({ target: { value: historyItem } });
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: '#e3f2fd',
                              },
                            }}
                          >
                            <ListItemText primary={historyItem} />
                          </ListItem>
                        ))}
                      </>
                    ) : (
                      <ListItem>
                        <ListItemText primary="Không tìm thấy kết quả" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              )}
            </form>
          </ClickAwayListener>
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

          <MenuItem onClick={handleProfile}>
            Thông tin cá nhân
          </MenuItem>

          <MenuItem onClick={handleEditSettings}>
            Cài đặt tài khoản
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            Đăng xuất
          </MenuItem>
        </Menu>


      </Toolbar>
    </AppBar>
  );
}