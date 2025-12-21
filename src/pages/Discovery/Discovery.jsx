import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Typography,
  TextField,
  Stack,
  Grid,
  Paper,
  MenuItem,
} from "@mui/material";

import { getAllEvents, deleteEvent, updateEvent } from "../../api/Events";
import placeholderImage from "../../assets/img/event_group.jpg";

export default function Discovery() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  const [events, setEvents] = useState([]);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
  });

  // Helper function để render banner URL
  const getBannerUrl = (banner) => {
    if (!banner) return placeholderImage;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner;
    const path = banner.startsWith("/") ? banner : `/${banner}`;
    return `http://localhost:5000${path}`;
  };

  /* ================= FILTER & SORT ================= */

  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("time-asc");

  /* ================= FETCH ================= */

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      // Hiển thị tất cả sự kiện đã được duyệt
      const approvedEvents = data.filter(event => event.status === "approved");
      setEvents(approvedEvents);
    })();
  }, []);

  /* ================= DERIVED ================= */

  const now = new Date();

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

  const filteredAndSortedEvents = useMemo(() => {
    let list = [...events];

    /* STATUS FILTER (manager only) */
    if (role === "manager" && statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }

    /* TIME FILTER */
    if (timeFilter !== "all") {
      list = list.filter((e) => {
        const start = new Date(e.date);
        const end = new Date(e.endDate);

        if (timeFilter === "ongoing")
          return start <= now && end >= now;
        if (timeFilter === "upcoming")
          return start > now;
        if (timeFilter === "previous")
          return end < now;

        return true;
      });
    }

    /* SORT */
    list.sort((a, b) => {
      if (sortBy === "name-asc")
        return a.name.localeCompare(b.name);
      if (sortBy === "name-desc")
        return b.name.localeCompare(a.name);
      if (sortBy === "time-desc")
        return new Date(b.date) - new Date(a.date);
      return new Date(a.date) - new Date(b.date);
    });

    return list;
  }, [events, role, statusFilter, timeFilter, sortBy]);

  /* ================= ACTIONS ================= */

  const handleDelete = async (e, slug) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này?")) {
      await deleteEvent({ slug, username });
      const data = await getAllEvents();
      const approvedEvents = data.filter(event => event.status === "approved");
      setEvents(approvedEvents);
    }
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    setEditing(event.slug);
    setForm({
      name: event.name,
      date: event.date.split("T")[0],
      endDate: event.endDate.split("T")[0],
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      location: event.location || "",
      description: event.description || "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await updateEvent({
      ...form,
      username,
      slug: editing,
    });

    setEditing(null);
    const data = await getAllEvents();
    const approvedEvents = data.filter(event => event.status === "approved");
    setEvents(approvedEvents);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditing(null);
  };

  /* ================= RENDER HELPERS ================= */

  const renderDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString();
    const e = new Date(end).toLocaleDateString();
    return s === e ? s : `${s} → ${e}`;
  };

  const renderTime = (start, end) => `${start} – ${end}`;

  const renderEventCard = (event) => {
    const isCreator = event.createdBy?.username === username;

    const statusMap = {
      approved: "Đã duyệt",
      pending: "Đang chờ duyệt",
      rejected: "Bị từ chối",
    };

    const eventStatusMap = {
      upcoming: "Sắp diễn ra",
      ongoing: "Đang diễn ra",
      completed: "Đã hoàn thành",
      cancelled: "Đã bị hủy"
    };

    const eventStatusColor = {
      upcoming: "#1976d2",
      ongoing: "#2e7d32",
      completed: "#757575",
      cancelled: "#d32f2f"
    };

    return (
      <Grid item xs={12} sm={6} md={4} key={event._id}>
        <Card
          sx={{ 
            height: "100%",
            minWidth: '20vw',
            cursor: editing !== event.slug ? 'pointer' : 'default'
          }}
          onClick={() =>
            editing !== event.slug && navigate(`/event/${event.slug}`)
          }
        >
          <CardContent>
            <Typography variant="h6" fontWeight="bold">
              {event.name}
            </Typography>

            <Typography 
              variant="caption" 
              display="block"
              sx={{ 
                color: eventStatusColor[calculateEventStatus(event)],
                fontWeight: 'bold',
                mb: 1
              }}
            >
              {eventStatusMap[calculateEventStatus(event)]}
            </Typography>

            {/* Event Banner */}
            <Box
              sx={{
                width: '100%',
                maxWidth: '20vw',
                height: '15vh',
                minHeight: '150px',
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: '#f5f5f5',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <img
                src={getBannerUrl(event.banner)}
                alt={event.name}
                loading="lazy"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderImage;
                }}
              />
            </Box>

            <Typography variant="body2">
              <b>Ngày:</b>{" "}
              {renderDateRange(event.date, event.endDate)}
            </Typography>

            <Typography variant="body2">
              <b>Thời gian:</b>{" "}
              {renderTime(event.startTime, event.endTime)}
            </Typography>

            <Typography variant="body2">
              <b>Địa điểm:</b>{" "}
              {event.location || "Chưa xác định"}
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Tình nguyện viên:</b>{" "}
              {event.volunteers?.length || 0} người
            </Typography>
          </CardContent>

          {isCreator && (
            <CardActions>
              <Button onClick={(e) => handleEdit(e, event)}>
                Chỉnh sửa
              </Button>
              <Button
                color="error"
                onClick={(e) => handleDelete(e, event.slug)}
              >
                Xóa
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>
    );
  };

  /* ================= UI ================= */

  return (
    <Container maxWidth="lg">
      {/* FILTERS */}
      <Paper sx={{ p: 3, mb: 4, mt: 12 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            select
            label="Thời gian"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="ongoing">Đang diễn ra</MenuItem>
            <MenuItem value="upcoming">Sắp tới</MenuItem>
            <MenuItem value="previous">Đã kết thúc</MenuItem>
          </TextField>

          <TextField
            select
            label="Sắp xếp"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="time-asc">Thời gian ↑</MenuItem>
            <MenuItem value="time-desc">Thời gian ↓</MenuItem>
            <MenuItem value="name-asc">Tên A → Z</MenuItem>
            <MenuItem value="name-desc">Tên Z → A</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* ALL EVENTS */}
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Khám phá sự kiện
      </Typography>

      {filteredAndSortedEvents.length === 0 ? (
        <Typography color="text.secondary">
          Không có sự kiện nào
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedEvents.map(renderEventCard)}
        </Grid>
      )}
    </Container>
  );
}
