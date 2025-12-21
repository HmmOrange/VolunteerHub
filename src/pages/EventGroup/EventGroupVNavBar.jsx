import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Drawer,
  Box,
  Toolbar,
  Divider,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Button // Thêm Button nếu muốn nút quay lại hoặc thử lại
} from "@mui/material";
import { ChatOutlined, Public, Lock, ErrorOutline, PeopleOutline } from "@mui/icons-material"; // Thêm ErrorOutline, PeopleOutline

import { getEventBySlug } from "../../api/Events";
import "./EventGroupVNavBar.css"; // Giữ nguyên CSS cũ
import eventGroupAvatar from "../../assets/img/event_group.jpg";

const mockChats = [
  { id: 1, name: "TeamTree" },
  { id: 2, name: "Hậu cần" },
  { id: 3, name: "Truyền thông" },
];

export default function EventGroupVNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Thêm state loading và error để kiểm soát UI
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true); // Mặc định là đang load
  const [error, setError] = useState(null);

  // Lấy userId để check quyền (nếu cần thiết cho logic backend)
  const userId = localStorage.getItem("userId");

  // Helper function để render banner URL
  const getBannerUrl = (banner) => {
    if (!banner) return null;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner;
    const path = banner.startsWith("/") ? banner : `/${banner}`;
    return `http://localhost:5000${path}`;
  }; 

  useEffect(() => {
    if (slug) {
      // Reset state mỗi khi đổi slug
      setLoading(true);
      setError(null);
      setEventData(null);

      (async () => {
        try {
          // Gọi API (Hàm này đã sửa ở bước trước để trả về error.status)
          const data = await getEventBySlug({ slug, userId });
          setEventData(data);
        } catch (err) {
          console.error("Failed to fetch event data:", err);
          setError(err); // Lưu lỗi vào state
        } finally {
          setLoading(false); // QUAN TRỌNG: Tắt loading dù thành công hay thất bại
        }
      })();
    }
  }, [slug, userId]);

  const handleNavigate = () => {
    if (drawerVariant === 'temporary') {
      onClose();
    }
  };

  // Hàm render nội dung chính để code gọn gàng
  const renderDrawerContent = () => {
    // 1. TRƯỜNG HỢP ĐANG TẢI
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      );
    }

    // 2. TRƯỜNG HỢP CÓ LỖI (Mới thêm)
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <ErrorOutline sx={{ fontSize: 48, color: '#d32f2f', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {error.status === 403 ? "Truy cập bị từ chối" : "Đã có lỗi xảy ra"}
          </Typography>
        </Box>
      );
    }

    // 3. TRƯỜNG HỢP THÀNH CÔNG (Hiển thị thông tin event + shortcuts tới các tab)
    if (eventData) {
      const isJoined = (eventData.volunteers || []).some(v => (v._id ? v._id.toString() : v).toString() === userId);
      const currentUserInEvent = (eventData.volunteers || []).find(v => (v._id ? v._id.toString() : v).toString() === userId);
      const currentUserIsCreator = ((eventData.createdBy?._id || eventData.createdBy) ? (eventData.createdBy._id ? eventData.createdBy._id.toString() : eventData.createdBy.toString()) : '') === userId;
      const isOwnerLocal = currentUserInEvent && currentUserIsCreator && (currentUserInEvent.role === 'manager');

      const items = [
        { id: 0, label: 'Bài đăng', icon: <ChatOutlined />, requiresJoin: eventData.privacy === 'Private' },
        { id: 1, label: 'Thông tin', icon: <Public /> },
        { id: 2, label: 'Thành viên', icon: <PeopleOutline /> },
      ];

      if (isOwnerLocal) {
        items.push({ id: 3, label: `Yêu cầu (${eventData.requests?.length || 0})`, icon: <ErrorOutline /> });
      }

      return (
        <Box 
          className="event-vnav-container"
          onClick={drawerVariant === 'temporary' ? onClose : undefined}
        >
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: 279, height: 140, mb: 1.5, overflow: 'hidden', bgcolor: '#f1f4f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={getBannerUrl(eventData.banner) || eventData.avatarUrl || eventGroupAvatar} alt={eventData.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>

            <Typography variant="h5" fontWeight="bold" textAlign="center">{eventData.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {eventData.privacy === 'Public' ? <Public sx={{ fontSize: '1rem', mr: 0.5 }} /> : <Lock sx={{ fontSize: '1rem', mr: 0.5 }} />}
              <Typography variant="body2" color="text.secondary">{eventData.privacy === 'Public' ? "Sự kiện Công khai" : "Sự kiện Riêng tư"} • {eventData.volunteers?.length || 0} thành viên</Typography>
            </Box>
          </Box>

          <Divider />

          <Typography variant="overline" className="chat-title" sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'text.secondary' }}>Lối tắt</Typography>
          <List sx={{ px: 1 }}>
            {items.map(item => {
              const locked = item.id === 0 && item.requiresJoin && !isJoined;
              return (
                <ListItemButton 
                  key={item.id} 
                  onClick={() => {
                    // Navigate to event page with tab query param
                    const base = `/event/${slug}`;
                    const url = `${base}?tab=${item.id}`;
                    navigate(url);
                    if (drawerVariant === 'temporary') onClose();
                  }} 
                  sx={{ 
                    opacity: locked ? 0.6 : 1,
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: locked ? 'rgba(0,0,0,0.04)' : 'rgba(73, 187, 189, 0.08)',
                      transform: locked ? 'none' : 'translateX(4px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    {locked ? (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#bdbdbd' }}>
                        <Lock sx={{ fontSize: '1.1rem' }} />
                      </Avatar>
                    ) : (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#49BBBD', boxShadow: 1 }}>
                        {item.icon}
                      </Avatar>
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: locked ? 400 : 500,
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      );
    }

    return null; // Trường hợp null data mà không lỗi
  };

  return (
    <Drawer
      variant={drawerVariant}
      anchor="left"
      open={isOpen}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        zIndex: 1200, 
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "2px solid #49BBBD",
          backgroundColor: "#fff", 
        },
      }}
    >
      <Toolbar />
      <Divider />
      
      {/* Gọi hàm render nội dung */}
      {renderDrawerContent()}

    </Drawer>
  );
}