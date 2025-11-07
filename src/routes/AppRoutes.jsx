import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../components/layout/Layout"; 
import Landing from "../pages/Landing/Landing";
import Register from "../pages/Register/Register";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateEvent from "../pages/CreateEvent/CreateEvent";

// 1. IMPORT VỚI TÊN FILE MỚI
import EventGroup from "../pages/EventGroup/EventGroup"; // Đổi từ EventGroupPage

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang CÓ layout (HNavBar/VNavBar) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/event/create" element={<CreateEvent />} />
          
          {/* 2. SỬ DỤNG COMPONENT VỚI TÊN MỚI */}
          <Route path="/event/:eventId" element={<EventGroup />} />

        </Route>

        {/* Các trang KHÔNG có layout */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}