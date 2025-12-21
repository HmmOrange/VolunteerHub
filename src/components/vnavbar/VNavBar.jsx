import { useNavigate } from "react-router-dom";
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Typography, Avatar, Toolbar,
} from "@mui/material";
import {
  HomeOutlined,
  EventOutlined,
  ExploreOutlined,
  CalendarMonthOutlined,
  PeopleOutline,
  AdminPanelSettingsOutlined,
} from "@mui/icons-material";

import "./VNavBar.css";

export default function VNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // ✅ READ ROLE ONCE

  const shortcuts = [
    { name: "TeamTree", avatar: "/path/to/tree-icon.png" },
    { name: "Sự kiện 2", avatar: "/path/to/tree-icon.png" },
    { name: "Sự kiện 3", avatar: "/path/to/tree-icon.png" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (drawerVariant === "temporary") {
      onClose();
    }
  };

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />

      {/* ===== MAIN NAV ===== */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/dashboard")}>
            <ListItemIcon><HomeOutlined /></ListItemIcon>
            <ListItemText primary="Trang chủ" sx={{ mt: 0.9 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/events")}>
            <ListItemIcon><EventOutlined /></ListItemIcon>
            <ListItemText primary="Sự kiện của bạn" sx={{ mt: 0.95 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/discover")}>
            <ListItemIcon><ExploreOutlined /></ListItemIcon>
            <ListItemText primary="Khám phá" sx={{ mt: 0.75 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate("/calendar")}>
            <ListItemIcon><CalendarMonthOutlined /></ListItemIcon>
            <ListItemText primary="Lịch" sx={{ mt: 0.85 }} />
          </ListItemButton>
        </ListItem>
      </List>

      {/* ===== ADMIN MANAGEMENT ===== */}
      {role === "admin" && (
        <>
          <Divider sx={{ mt: 1 }} />

          <Typography variant="overline" className="vnavbar-shortcut-title">
            Quản lý
          </Typography>

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate("/admin/users")}>
                <ListItemIcon>
                  <PeopleOutline />
                </ListItemIcon>
                <ListItemText primary="Người dùng" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate("/admin/events")}>
                <ListItemIcon>
                  <AdminPanelSettingsOutlined />
                </ListItemIcon>
                <ListItemText primary="Sự kiện" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}

      {/* ===== SHORTCUTS ===== */}
      <Divider />

      <Typography variant="overline" className="vnavbar-shortcut-title">
        Lối tắt
      </Typography>

      <List>
        {shortcuts.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton onClick={() => handleNavigate(`/event/${item.name}`)}>
              <ListItemIcon>
                <Avatar src={item.avatar} className="vnavbar-shortcut-avatar">
                  {item.name.charAt(0)}
                </Avatar>
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
      onClick={drawerVariant === "temporary" ? onClose : undefined}
    >
      {drawerContent}
    </Drawer>
  );
}
