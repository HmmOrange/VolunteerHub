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
import { useEffect, useState } from "react";
import { getUserEvents } from "../../api/Events";

import "./VNavBar.css";

export default function VNavBar({ isOpen, drawerWidth, drawerVariant, onClose }) {
  const navigate = useNavigate();
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
