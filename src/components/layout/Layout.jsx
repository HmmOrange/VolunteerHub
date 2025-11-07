import { useState } from "react";
import { Outlet, useMatch } from "react-router-dom"; // 1. Thêm useMatch
import { Box } from "@mui/material";

// 2. Import cả HAI VNavBars
import HNavbar from "../hnavbar/HNavBar";
import VNavBar from "../vnavbar/VNavBar"; // VNavBar chính (Dashboard)
import EventGroupVNavBar from "../../pages/EventGroup/EventGroupVNavBar"; // VNavBar mới (EventGroup)

const DRAWER_WIDTH = 280; 

export default function Layout() {
  const [isVNavOpen, setIsVNavOpen] = useState(true);

  // 3. Kiểm tra xem URL có khớp với trang EventGroup không
  const eventMatch = useMatch("/event/:eventId");
  // Lấy eventId nếu khớp, nếu không eventId sẽ là null
  const eventId = eventMatch?.params?.eventId; 

  const handleToggleVNav = () => {
    setIsVNavOpen(!isVNavOpen);
  };

  return (
    <Box>
      {/* HNAVBAR (Không đổi) */}
      <HNavbar onToggleVNavBar={handleToggleVNav} />

      {/* 4. LOGIC HIỂN THỊ VNAVBAR CÓ ĐIỀU KIỆN */}
      {eventId ? (
        // Nếu đang ở trang Event, render EventGroupVNavBar
        <EventGroupVNavBar
          isOpen={isVNavOpen}
          drawerWidth={DRAWER_WIDTH}
          eventId={eventId} // Truyền eventId xuống
        />
      ) : (
        // Nếu ở trang khác, render VNavBar mặc định
        <VNavBar
          isOpen={isVNavOpen}
          drawerWidth={DRAWER_WIDTH}
        />
      )}

      {/* NỘI DUNG CHÍNH (Outlet - Không đổi) */}
      <Box
        component="main"
        sx={{
          boxSizing: "border-box", 
          marginTop: "64px", 
          transition: "margin-left 0.2s ease, width 0.2s ease",
          marginLeft: isVNavOpen ? `${DRAWER_WIDTH}px` : 0,
          width: `calc(100% - ${isVNavOpen ? `${DRAWER_WIDTH}px` : '0px'})`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}