import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing/Landing";
import Register from "../pages/Register/Register";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateEvent from "../pages/CreateEvent/CreateEvent";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/event/create" element={<CreateEvent />} />
      </Routes>
    </BrowserRouter>
  );
}
