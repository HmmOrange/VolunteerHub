import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { ChatOutlined, Public, Lock, ErrorOutline } from "@mui/icons-material"; // Thêm ErrorOutline

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
  
  // Thêm state loading và error để kiểm soát UI
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true); // Mặc định là đang load
  const [error, setError] = useState(null);

  // Lấy userId để check quyền (nếu cần thiết cho logic backend)
  const userId = localStorage.getItem("userId"); 

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

    // 3. TRƯỜNG HỢP THÀNH CÔNG (Giữ nguyên cấu trúc HTML/CSS cũ của bạn)
    if (eventData) {
      return (
        <Box 
          className="event-vnav-container" // Class CSS cũ
          onClick={drawerVariant === 'temporary' ? onClose : undefined}
        >
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={eventData.avatarUrl || eventGroupAvatar} // Ưu tiên avatar từ API
              alt="Event Avatar" 
              sx={{ width: 279, height: 125, mb: 1.5 }} 
              variant="square" 
            />
            <Typography variant="h5" fontWeight="bold" textAlign="center">
              {eventData.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              {eventData.privacy === 'Public' ? (
                <Public sx={{ fontSize: '1rem', mr: 0.5 }} />
              ) : (
                <Lock sx={{ fontSize: '1rem', mr: 0.5 }} />
              )}
              <Typography variant="body2" color="text.secondary">
                {eventData.privacy === 'Public' ? "Sự kiện Công khai" : "Sự kiện Riêng tư"} • {eventData.volunteers?.length || 0} thành viên
              </Typography>
            </Box>
          </Box>
          
          <Divider />
          
          <Typography variant="overline" className="chat-title"> {/* Class CSS cũ */}
            Đoạn chat
          </Typography>
          <List dense>
            {mockChats.map((chat) => (
              <ListItemButton key={chat.id} onClick={handleNavigate}>
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#49BBBD' }}>
                    <ChatOutlined sx={{ fontSize: '1rem' }} />
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={chat.name} />
              </ListItemButton>
            ))}
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
          borderRight: "1px solid #e0e0e0",
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