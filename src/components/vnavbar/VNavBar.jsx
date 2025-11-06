import { useNavigate } from "react-router-dom";
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Typography, Avatar, Toolbar, // Thêm Toolbar
} from "@mui/material";
import {
  HomeOutlined, EventOutlined, ExploreOutlined, CalendarMonthOutlined,
} from "@mui/icons-material";

// Import file CSS
import "./VNavBar.css";

export default function VNavBar({ isOpen, drawerWidth }) {
  const navigate = useNavigate();

  const shortcuts = [
    { name: "TeamTree", avatar: "/path/to/tree-icon.png" }, // Thay bằng path thật
    { name: "Sự kiện 2", avatar: "/path/to/tree-icon.png" },
    { name: "Sự kiện 3", avatar: "/path/to/tree-icon.png" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  const drawerContent = (
    <div>
      {/* QUAN TRỌNG: Thêm Toolbar để đẩy nội dung VNavBar
         xuống dưới HNavBar (cao 64px) */}
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
      variant="persistent" // QUAN TRỌNG: Dùng "persistent"
      anchor="left"
      open={isOpen} // Trạng thái đóng/mở
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        // Đặt z-index thấp hơn HNavBar
        zIndex: 1200, 
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #e0e0e0",
          backgroundColor: "#fff", 
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}