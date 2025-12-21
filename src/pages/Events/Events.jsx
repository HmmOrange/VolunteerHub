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

export default function Events() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);

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

  /* ================= FILTER & SORT (JOINED EVENTS ONLY) ================= */

  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("time-asc");

  /* ================= FETCH ================= */

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      setEvents(data);

      if (!userId) return;

      const joined = data.filter(
        (event) =>
          event.status === "approved" &&
          event.volunteers?.some((v) =>
            typeof v === "string"
              ? v === userId
              : v._id?.toString() === userId
          )
      );

      setJoinedEvents(joined);
    })();
  }, [userId]);

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

  const filteredAndSortedJoinedEvents = useMemo(() => {
    let list = [...joinedEvents];

    /* STATUS FILTER (manager only, mostly redundant but kept) */
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
  }, [joinedEvents, role, statusFilter, timeFilter, sortBy]);

  /* ================= ACTIONS ================= */

  const handleDelete = async (e, slug) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này?")) {
      await deleteEvent({ slug, username });
      const data = await getAllEvents();
      setEvents(data);
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
    setEvents(data);
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

    const calcStatus = calculateEventStatus(event);
    const serverStatusLabel = statusMap[event.status] || '';
    const timeStatusLabel = eventStatusMap[calcStatus];

    const startDate = new Date(event.date);
    if (event.startTime) {
      const [h, m] = event.startTime.split(":");
      startDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    const endDate = new Date(event.endDate || event.date);
    if (event.endTime) {
      const [h2, m2] = event.endTime.split(":");
      endDate.setHours(parseInt(h2), parseInt(m2), 0, 0);
    }

    const fmtDate = (d) => d.toLocaleDateString();
    const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const shortDesc = event.description ? (event.description.length > 160 ? event.description.slice(0, 157) + '...' : event.description) : 'Không có mô tả';

    return (
      <Grid item xs={12} sm={6} md={4} key={event._id}>
        <Card
          sx={{
            height: "100%",
            minWidth: '20vw',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform .18s ease, box-shadow .18s ease',
            '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' },
            cursor: editing !== event.slug ? 'pointer' : 'default'
          }}
          onClick={() => editing !== event.slug && navigate(`/event/${event.slug}`)}
        >
          <CardContent sx={{ flex: '1 1 auto' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {event.name}
            </Typography>

            {/* Event Banner */}
            <Box sx={{ width: '100%', height: 160, mb: 2, borderRadius: 1, overflow: 'hidden', bgcolor: '#f5f5f5', position: 'relative' }}>
              <img
                src={getBannerUrl(event.banner)}
                alt={event.name}
                loading="lazy"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
              />
            </Box>

            <Typography variant="body2" sx={{ mb: 0.5 }}><b>Bắt đầu:</b> {fmtDate(startDate)} · {fmtTime(startDate)}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><b>Kết thúc:</b> {fmtDate(endDate)} · {fmtTime(endDate)}</Typography>

            <Typography variant="body2" sx={{ mb: 1 }}><b>Địa điểm:</b> {event.location || 'Chưa xác định'}</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{shortDesc}</Typography>
          </CardContent>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, pt: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {serverStatusLabel && (
                <Box sx={{ bgcolor: '#f0f0f0', color: '#333', px: 1, py: '2px', borderRadius: '12px', fontSize: 12, fontWeight: 700 }}>
                  {serverStatusLabel}
                </Box>
              )}
              {timeStatusLabel && (
                <Box sx={{ bgcolor: eventStatusColor[calcStatus], color: '#fff', px: 1, py: '2px', borderRadius: '12px', fontSize: 12, fontWeight: 700 }}>
                  {timeStatusLabel}
                </Box>
              )}
            </Box>
          </Box>

          
        </Card>
      </Grid>
    );
  };

  /* ================= UI ================= */

  return (
    <Container maxWidth="lg">
      {/* FILTERS — JOINED EVENTS ONLY */}
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

      {/* JOINED EVENTS */}
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Sự kiện bạn đã tham gia
      </Typography>

      {filteredAndSortedJoinedEvents.length === 0 ? (
        <Typography color="text.secondary">
          Bạn chưa tham gia sự kiện nào
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedJoinedEvents.map(renderEventCard)}
        </Grid>
      )}
    </Container>
  );
}
