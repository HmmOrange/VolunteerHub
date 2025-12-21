import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../components/layout/Layout"; 
import Landing from "../pages/Landing/Landing";
import Register from "../pages/Register/Register";
import Login from "../pages/login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateEvent from "../pages/CreateEvent/CreateEvent";
import EventGroup from "../pages/EventGroup/EventGroup";
import UserList from "../pages/AdminUserList/AdminUserList";
import Events from "../pages/Events/Events";
import Discovery from "../pages/Discovery/Discovery";
import Profile from "../pages/Profile/Profile";
import AdminEventList from "../pages/AdminEventList/AdminEventList";
import UserSetting from "../pages/UserSetting/UserSetting";
import SearchResults from "../pages/SearchResults/SearchResults";
import CalendarPage from "../pages/Calendar/Calendar";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các trang CÓ layout (HNavBar/VNavBar) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/discover" element={<Discovery />} />
          <Route path="/event/create" element={<CreateEvent />} />
          <Route path="/event/:slug" element={<EventGroup />} />
          <Route path="/admin/users" element={<UserList />} />
          <Route path="/admin/events" element={<AdminEventList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<UserSetting />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>

        {/* Các trang KHÔNG có layout */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}