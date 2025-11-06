import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

import HNavbar from "../hnavbar/HNavBar";
import VNavBar from "../vnavbar/VNavBar";

// Chiều rộng của VNavBar
const DRAWER_WIDTH = 280; 

export default function Layout() {
  const [isVNavOpen, setIsVNavOpen] = useState(true); // Mặc định mở

  const handleToggleVNav = () => {
    setIsVNavOpen(!isVNavOpen);
  };

  return (
    // XÓA 'display: "flex"' TẠI ĐÂY
    <Box>
      {/* HNAVBAR: Luôn cố định 100% ở trên */}
      <HNavbar onToggleVNavBar={handleToggleVNav} />

      {/* VNAVBAR: Sẽ đóng/mở */}
      <VNavBar
        isOpen={isVNavOpen}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* NỘI DUNG CHÍNH (Dashboard, CreateEvent...) */}
      <Box
        component="main"
        sx={{
          // Thêm 'box-sizing' để đảm bảo padding (p: 3) không làm vỡ layout
          boxSizing: "border-box", 
          // Đẩy nội dung xuống dưới HNavBar (cao 64px)
          marginTop: "64px", 
          // Thêm transition cho mượt
          transition: "margin-left 0.2s ease, width 0.2s ease",
          // Đẩy nội dung sang phải KHI VNavBar mở
          marginLeft: isVNavOpen ? `${DRAWER_WIDTH}px` : 0,
          // Tính toán lại chiều rộng của khung chứa nội dung
          width: `calc(100% - ${isVNavOpen ? `${DRAWER_WIDTH}px` : '0px'})`,
        }}
      >
        {/* Outlet sẽ render Dashboard/CreateEvent vào đây */}
        <Outlet />
      </Box>
    </Box>
  );
}