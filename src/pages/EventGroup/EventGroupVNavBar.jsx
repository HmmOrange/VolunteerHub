import { useState, useEffect } from "react";
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
} from "@mui/material";
import { ChatOutlined, Public, Lock } from "@mui/icons-material";

// Import CSS
import "./EventGroupVNavBar.css";

// Import ảnh avatar
import eventGroupAvatar from "../../assets/img/event_group.jpg";

// Dữ liệu giả lập
const mockEventData = {
  name: "TeamTree",
  privacy: "Public",
  memberCount: 123,
};
const mockChats = [
  { id: 1, name: "TeamTree" },
  { id: 2, name: "Hậu cần" },
  { id: 3, name: "Truyền thông" },
];

export default function EventGroupVNavBar({ isOpen, drawerWidth, eventId }) {
  const [eventData, setEventData] = useState(mockEventData);
  
  // (Sau này dùng eventId để fetch data)
  // useEffect(() => { ... }, [eventId]);

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
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
      
      <Box className="event-vnav-container">
        
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Avatar sự kiện (ảnh đại diện) */}
          <Avatar 
            src={eventGroupAvatar} 
            alt="Event Avatar" 
            sx={{ width: 279, height: 125, mb: 1.5 }} 
            variant="square" 
          />
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            {eventData.name} (Sự kiện)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {eventData.privacy === 'Public' ? (
              <Public sx={{ fontSize: '1rem', mr: 0.5 }} />
            ) : (
              <Lock sx={{ fontSize: '1rem', mr: 0.5 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              {eventData.privacy === 'Public' ? "Sự kiện Công khai" : "Sự kiện Riêng tư"} • {eventData.memberCount} thành viên
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <Typography variant="overline" className="chat-title">
          Đoạn chat
        </Typography>
        <List dense>
          {mockChats.map((chat) => (
            <ListItemButton key={chat.id}>
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
    </Drawer>
  );
}