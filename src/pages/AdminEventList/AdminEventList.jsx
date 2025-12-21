import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

const API_BASE = "http://localhost:5000/api/events";

export default function AdminEventList() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // === HÀM TÍNH TRẠNG THÁI TỰ ĐỘNG ===
  const calculateEventStatus = (event) => {
    if (!event) return 'upcoming';
    
    // Chỉ giữ trạng thái cancelled nếu đã bị hủy
    if (event.eventStatus === 'cancelled') return 'cancelled';
    
    // Còn lại tất cả dựa vào thời gian thực tế
    const now = new Date();
    const startDate = new Date(event.date);
    if (event.startTime) {
      const [h, m] = event.startTime.split(':');
      startDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    const endDate = new Date(event.endDate || event.date);
    if (event.endTime) {
      const [h, m] = event.endTime.split(':');
      endDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  // ===== FETCH EVENTS =====
  const fetchData = async () => {
    setLoading(true);
    try {
      // Sử dụng endpoint admin để lấy tất cả events
      const res = await fetch(`${API_BASE}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch events");

      const events = await res.json();

      setAllEvents(events);
      // ✅ FIX: use status instead of approved
      setPendingEvents(events.filter((e) => e.status === "pending"));
    } catch (err) {
      console.error("AdminEventList error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchData();
    }
  }, [role]);

  // ===== ACTIONS =====
  const handleApprove = async (eventId) => {
    if (!window.confirm("Xác nhận duyệt sự kiện này?")) return;

    await fetch(`${API_BASE}/admin/${eventId}/approved`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  const handleReject = async (eventId) => {
    if (!window.confirm("Từ chối sự kiện này?")) return;

    await fetch(`${API_BASE}/admin/${eventId}/rejected`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  if (role !== "admin") {
    return (
      <Typography sx={{ p: 4, color: "error.main" }}>
        Bạn không có quyền truy cập trang này.
      </Typography>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const renderEventTable = (events, showActions = false) => {
    const eventStatusMap = {
      upcoming: "Sắp diễn ra",
      ongoing: "Đang diễn ra",
      completed: "Đã hoàn thành",
      cancelled: "Đã bị hủy"
    };

    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tên sự kiện</TableCell>
            <TableCell>Người tạo</TableCell>
            <TableCell>Ngày</TableCell>
            <TableCell>Địa điểm</TableCell>
            <TableCell>Riêng tư</TableCell>
            <TableCell>Phê duyệt</TableCell>
            <TableCell>Trạng thái</TableCell>
            {showActions && <TableCell align="right">Hành động</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e._id}>
              <TableCell>{e.name}</TableCell>
              <TableCell>{e.createdBy?.username}</TableCell>
              <TableCell>
                {new Date(e.date).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell>{e.location}</TableCell>
              <TableCell>{e.privacy}</TableCell>
              <TableCell>
                {/* ✅ FIX: render by status */}
                <Chip
                  size="small"
                  label={
                    e.status === "approved"
                      ? "Đã duyệt"
                      : e.status === "rejected"
                      ? "Từ chối"
                      : "Chờ duyệt"
                  }
                  color={
                    e.status === "approved"
                      ? "success"
                      : e.status === "rejected"
                      ? "error"
                      : "warning"
                  }
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={eventStatusMap[calculateEventStatus(e)]}
                  color={
                    calculateEventStatus(e) === "ongoing"
                      ? "success"
                      : calculateEventStatus(e) === "completed"
                      ? "default"
                      : calculateEventStatus(e) === "cancelled"
                      ? "error"
                      : "info"
                  }
                />
              </TableCell>

              {showActions && (
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(e._id)}
                    >
                      Duyệt
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(e._id)}
                    >
                      Từ chối
                    </Button>
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* ===== PENDING EVENTS ===== */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Sự kiện chờ duyệt
      </Typography>

      <Paper variant="outlined">
        {pendingEvents.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Không có sự kiện nào đang chờ duyệt.
          </Typography>
        ) : (
          renderEventTable(pendingEvents, true)
        )}
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* ===== ALL EVENTS ===== */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Tất cả sự kiện
      </Typography>

      <Paper variant="outlined">
        {allEvents.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Chưa có sự kiện nào.
          </Typography>
        ) : (
          renderEventTable(allEvents, false)
        )}
      </Paper>
    </Container>
  );
}
