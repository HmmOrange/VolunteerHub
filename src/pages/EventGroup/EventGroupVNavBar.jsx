import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 1. Import useParams
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
  CircularProgress, // Thêm vòng xoay tải
} from "@mui/material";
import { ChatOutlined, Public, Lock } from "@mui/icons-material";

// 2. Import hàm API mới
import { getEventById } from "../../api/Events";
import "./EventGroupVNavBar.css";
import eventGroupAvatar from "../../assets/img/event_group.jpg";

// (Giữ lại mockChats)
const mockChats = [
  { id: 1, name: "TeamTree" },
  { id: 2, name: "Hậu cần" },
  { id: 3, name: "Truyền thông" },
];

// Nhận props từ Layout
export default function EventGroupVNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const { eventId } = useParams(); // 3. Lấy eventId từ URL
  const [eventData, setEventData] = useState(null); // 4. Bắt đầu với state rỗng
  
  // 5. Dùng useEffect để gọi API khi eventId thay đổi
  useEffect(() => {
    if (eventId) {
      setEventData(null); // Xóa dữ liệu cũ
      (async () => {
        try {
          const data = await getEventById({ eventId }); 
          setEventData(data);
        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [eventId]); // Phụ thuộc vào eventId

  const handleNavigate = () => {
    // (Logic điều hướng chat...)
    if (drawerVariant === 'temporary') {
      onClose();
    }
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
      
      {/* 6. Thêm kiểm tra 'loading' */}
      {!eventData ? (
        // Nếu đang tải
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Nếu đã tải xong
        <Box 
          className="event-vnav-container"
          onClick={drawerVariant === 'temporary' ? onClose : undefined}
        >
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={eventGroupAvatar} 
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
              {/* Sử dụng volunteers.length từ CSDL */}
              <Typography variant="body2" color="text.secondary">
                {eventData.privacy === 'Public' ? "Sự kiện Công khai" : "Sự kiện Riêng tư"} • {eventData.volunteers?.length || 0} thành viên
              </Typography>
            </Box>
          </Box>
          
          <Divider />
          
          <Typography variant="overline" className="chat-title">
            Đoạn chat
          </Typography>
          <List dense>
            {mockChats.map((chat) => (
              <ListItemButton key={chat.id} onClick={handleNavigate}>
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                    <ChatOutlined sx={{ fontSize: '1rem' }} />
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={chat.name} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Drawer>
  );
}