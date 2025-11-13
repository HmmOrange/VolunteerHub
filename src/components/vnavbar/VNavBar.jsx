import { useNavigate } from "react-router-dom";
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Typography, Avatar, Toolbar,
} from "@mui/material";
import {
  HomeOutlined, EventOutlined, ExploreOutlined, CalendarMonthOutlined,
} from "@mui/icons-material";

import "./VNavBar.css";

// Nhận props mới: 'drawerVariant' và 'onClose'
export default function VNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const navigate = useNavigate();

  const shortcuts = [
    { name: "TeamTree", avatar: "/path/to/tree-icon.png" }, // Thay bằng path thật
    { name: "Sự kiện 2", avatar: "/path/to/tree-icon.png" },
    { name: "Sự kiện 3", avatar: "/path/to/tree-icon.png" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    // Nếu là 'temporary' (mobile), tự động đóng VNav sau khi click
    if (drawerVariant === 'temporary') {
      onClose();
    }
  };

  const drawerContent = (
    <div>
      <Toolbar /> 
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/dashboard")}>
            <ListItemIcon><HomeOutlined /></ListItemIcon>
            <ListItemText primary="Trang chủ" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/events")}>
            <ListItemIcon><EventOutlined /></ListItemIcon>
            <ListItemText primary="Sự kiện" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/discover")}>
            <ListItemIcon><ExploreOutlined /></ListItemIcon>
            <ListItemText primary="Khám phá" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/calendar")}>
            <ListItemIcon><CalendarMonthOutlined /></ListItemIcon>
            <ListItemText primary="Lịch" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider />

      <Typography variant="overline" className="vnavbar-shortcut-title">
        Lối tắt
      </Typography>
      
      <List>
        {shortcuts.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton onClick={() => handleNavigate(`/event/${item.name}`)}>
              <ListItemIcon>
                <Avatar src={item.avatar} className="vnavbar-shortcut-avatar">T</Avatar>
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Drawer
      // Sử dụng props mới
      variant={drawerVariant} // Thay 'persistent' bằng prop
      anchor="left"
      open={isOpen}
      onClose={onClose} // Dùng khi là 'temporary'
      
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
      // (Quan trọng) Đảm bảo đóng VNav khi bấm vào nội dung (chỉ áp dụng cho temporary)
      onClick={drawerVariant === 'temporary' ? onClose : undefined}
    >
      {drawerContent}
    </Drawer>
  );
}