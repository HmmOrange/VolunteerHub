import { useNavigate, useLocation } from "react-router-dom";
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
import { useEffect, useState } from "react";
import { getUserEvents } from "../../api/Events";

import "./VNavBar.css";

export default function VNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role"); // ✅ READ ROLE ONCE

  const [shortcuts, setShortcuts] = useState([]);

  // Load up to 5 events the user has joined
  useEffect(() => {
    const loadUserEvents = async () => {
      try {
        const userJson = localStorage.getItem("user");
        let userId = null;
        if (userJson) {
          try {
            const userObj = JSON.parse(userJson);
            userId = userObj._id || userObj.id || null;
          } catch (e) {
            // fallback: maybe stored as plain id
            userId = userJson;
          }
        } else {
          // fallback to explicit localStorage key
          userId = localStorage.getItem("userId");
        }

        if (!userId) return;

        const resp = await getUserEvents(userId);
        // API returns { message, events } — normalize to array
        const events = Array.isArray(resp) ? resp : resp?.events || [];
        const list = (events || []).slice(0, 5).map((ev) => ({
          name: ev.name || ev.title || ev.slug || "Sự kiện",
          avatar: ev.banner || ev.image || "",
          slug: ev.slug || ev._id || ev.id,
        }));

        setShortcuts(list);
      } catch (err) {
        console.error("Failed to load user events for shortcuts:", err);
      }
    };

    loadUserEvents();
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    if (drawerVariant === "temporary") {
      onClose();
    }
  };

  const drawerContent = (
    <div style={{ borderRight: '2px solid #49BBBD', height: '100%' }}>
      <Toolbar />
      <Divider />

      {/* ===== MAIN NAV ===== */}
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigate("/dashboard")}
            sx={{
              borderBottom: location.pathname === "/dashboard" ? "3px solid #49BBBD" : "none",
              color: location.pathname === "/dashboard" ? "#49BBBD" : "inherit"
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === "/dashboard" ? "#49BBBD" : "inherit" }}>
              <HomeOutlined />
            </ListItemIcon>
            <ListItemText primary="Trang chủ" sx={{ mt: 0.9 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigate("/events")}
            sx={{
              borderBottom: location.pathname === "/events" ? "3px solid #49BBBD" : "none",
              color: location.pathname === "/events" ? "#49BBBD" : "inherit"
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === "/events" ? "#49BBBD" : "inherit" }}>
              <EventOutlined />
            </ListItemIcon>
            <ListItemText primary="Sự kiện của bạn" sx={{ mt: 0.95 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigate("/discover")}
            sx={{
              borderBottom: location.pathname === "/discover" ? "3px solid #49BBBD" : "none",
              color: location.pathname === "/discover" ? "#49BBBD" : "inherit"
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === "/discover" ? "#49BBBD" : "inherit" }}>
              <ExploreOutlined />
            </ListItemIcon>
            <ListItemText primary="Khám phá" sx={{ mt: 0.75 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigate("/calendar")}
            sx={{
              borderBottom: location.pathname === "/calendar" ? "3px solid #49BBBD" : "none",
              color: location.pathname === "/calendar" ? "#49BBBD" : "inherit"
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === "/calendar" ? "#49BBBD" : "inherit" }}>
              <CalendarMonthOutlined />
            </ListItemIcon>
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
              <ListItemButton 
                onClick={() => handleNavigate("/admin/users")}
                sx={{
                  borderBottom: location.pathname === "/admin/users" ? "3px solid #49BBBD" : "none",
                  color: location.pathname === "/admin/users" ? "#49BBBD" : "inherit"
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === "/admin/users" ? "#49BBBD" : "inherit" }}>
                  <PeopleOutline />
                </ListItemIcon>
                <ListItemText primary="Người dùng" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigate("/admin/events")}
                sx={{
                  borderBottom: location.pathname === "/admin/events" ? "3px solid #49BBBD" : "none",
                  color: location.pathname === "/admin/events" ? "#49BBBD" : "inherit"
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === "/admin/events" ? "#49BBBD" : "inherit" }}>
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
          <ListItem key={item.slug || item.name} disablePadding>
            <ListItemButton onClick={() => handleNavigate(item.slug ? `/event/${item.slug}` : `/events`)}>
              <ListItemIcon>
                <Avatar src={item.avatar} className="vnavbar-shortcut-avatar">
                  {item.name ? item.name.charAt(0) : "S"}
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
