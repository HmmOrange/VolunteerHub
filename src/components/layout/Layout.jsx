import { useState, useEffect } from "react";
import { Outlet, useMatch } from "react-router-dom";
import { Box } from "@mui/material";
// Import hook mới của MUI
import { useTheme, useMediaQuery } from "@mui/material";

import HNavbar from "../hnavbar/HNavBar";
import VNavBar from "../vnavbar/VNavBar"; 
import EventGroupVNavBar from "../../pages/EventGroup/EventGroupVNavBar"; 

const DRAWER_WIDTH = 280; 

export default function Layout() {
  // Setup hook để phát hiện màn hình mobile
  const theme = useTheme();
  // 'md' (medium) tương đương 900px. Dưới 900px sẽ là mobile
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mặc định VNav mở trên desktop, đóng trên mobile
  const [isVNavOpen, setIsVNavOpen] = useState(!isMobile);

  const eventMatch = useMatch("/event/:eventId");
  const createMatch = useMatch("/event/create"); 
  const eventId = eventMatch?.params?.eventId; 

  const handleToggleVNav = () => {
    setIsVNavOpen(!isVNavOpen);
  };

  // Thêm useEffect để tự động đóng/mở VNavBar khi đổi kích thước
  useEffect(() => {
    // Nếu là mobile, tự động đóng. Nếu là desktop, tự động mở.
    setIsVNavOpen(!isMobile);
  }, [isMobile]); // Chạy lại khi 'isMobile' thay đổi

  // Quyết định VNavBar là loại "nổi" (temporary) hay "đẩy" (persistent)
  const drawerVariant = isMobile ? 'temporary' : 'persistent';

  return (
    <Box>
      <HNavbar onToggleVNavBar={handleToggleVNav} />

      {/* Truyền 'drawerVariant' và 'onClose' xuống cho CẢ HAI VNavBar */}
      {(eventMatch && !createMatch) ? (
        <EventGroupVNavBar
          isOpen={isVNavOpen}
          drawerWidth={DRAWER_WIDTH}
          eventId={eventId} 
          drawerVariant={drawerVariant} // Prop mới
          onClose={handleToggleVNav}    // Prop mới (để đóng khi bấm ra ngoài)
        />
      ) : (
        <VNavBar
          isOpen={isVNavOpen}
          drawerWidth={DRAWER_WIDTH}
          drawerVariant={drawerVariant} // Prop mới
          onClose={handleToggleVNav}    // Prop mới
        />
      )}

      {/* Sửa logic của Box nội dung chính */}
      <Box
        component="main"
        sx={{
          boxSizing: "border-box", 
          marginTop: "64px", 
          transition: "margin-left 0.2s ease, width 0.2s ease",
          // Chỉ đẩy nội dung (marginLeft) KHI VNavBar MỞ và ở CHẾ ĐỘ DESKTOP
          marginLeft: isVNavOpen && !isMobile ? `${DRAWER_WIDTH}px` : 0,
          width: `calc(100% - ${isVNavOpen && !isMobile ? `${DRAWER_WIDTH}px` : '0px'})`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}