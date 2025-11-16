import { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // 1. Giữ useParams
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
} from "@mui/material";
import { ChatOutlined, Public, Lock } from "@mui/icons-material";

// 2. Sửa import (quan trọng)
import { getEventBySlug } from "../../api/Events"; // Đổi từ getEventById
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
  // 3. Lấy slug từ URL (thay vì eventId)
  const { slug } = useParams(); 
  const [eventData, setEventData] = useState(null); 
  
  // 4. Dùng useEffect để gọi API bằng slug
  useEffect(() => {
    if (slug) { // 5. Kiểm tra slug
      setEventData(null); 
      (async () => {
        try {
          // 6. Gọi API mới
          const data = await getEventBySlug({ slug }); 
          setEventData(data);
        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [slug]); // 7. Phụ thuộc vào slug

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
      
      {!eventData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
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