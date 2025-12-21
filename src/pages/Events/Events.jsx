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
import ConfirmDialog from "../../components/common/ConfirmDialog";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({ title: '', description: '', onConfirm: null });

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
    setConfirmOptions({
      title: 'Xóa sự kiện',
      description: 'Bạn có chắc muốn xóa sự kiện này?',
      onConfirm: async () => {
        await deleteEvent({ slug, username });
        const data = await getAllEvents();
        setEvents(data);
      }
    });
    setConfirmOpen(true);
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
      <Box 
        key={event._id}
        sx={{
          width: { 
            xs: '100%', 
            sm: 'calc(50% - 0.75rem)', 
            md: 'calc(33.333% - 1.35rem)' 
          },
          flexShrink: 0
        }}
      >
        <Card
          sx={{
            height: "100%",
            minWidth: '20vw',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform .18s ease, box-shadow .18s ease, border .18s ease',
            border: '2px solid transparent',
            '&:hover': { 
              transform: 'translateY(-6px)', 
              boxShadow: '0 12px 30px rgba(73, 187, 189, 0.2)',
              border: '2px solid #49BBBD'
            },
            cursor: editing !== event.slug ? 'pointer' : 'default'
          }}
          onClick={() => editing !== event.slug && navigate(`/event/${event.slug}`)}
        >
          <CardContent sx={{ flex: '1 1 auto' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {event.name}
            </Typography>

            {/* Event Banner */}
            <Box sx={{ width: '100%', height: 160, mb: 2, borderRadius: 1, overflow: 'hidden', bgcolor: '#f1f4f7', position: 'relative' }}>
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
      </Box>
    );
  };

  /* ================= UI ================= */

  return (
    <>
    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      {/* FILTERS — JOINED EVENTS ONLY */}
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 3, md: 4 }, mt: { xs: 6, sm: 7, md: 8 }, border: '2px solid #49BBBD' }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
        >
          <TextField
            select
            label="Thời gian"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            sx={{ 
              width: { xs: '100%', sm: '45%', md: '20vw' },
              maxWidth: '20rem'
            }}
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
            sx={{ 
              width: { xs: '100%', sm: '45%', md: '20vw' },
              maxWidth: '20rem'
            }}
          >
            <MenuItem value="time-asc">Thời gian ↑</MenuItem>
            <MenuItem value="time-desc">Thời gian ↓</MenuItem>
            <MenuItem value="name-asc">Tên A → Z</MenuItem>
            <MenuItem value="name-desc">Tên Z → A</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* JOINED EVENTS */}
      <Typography 
        variant="h5" 
        fontWeight="bold" 
        mb={3}
        sx={{ 
          fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' }
        }}
      >
        Sự kiện bạn đã tham gia
      </Typography>

      {filteredAndSortedJoinedEvents.length === 0 ? (
        <Typography 
          color="text.secondary"
        >
          Bạn chưa tham gia sự kiện nào
        </Typography>
      ) : (
        <Box sx={{ bgcolor: 'white', p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2, border: '2px solid #49BBBD' }}>
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: '1rem', sm: '1.5rem', md: '2rem' }
          }}>
            {filteredAndSortedJoinedEvents.map(renderEventCard)}
          </Box>
        </Box>
      )}
    </Container>
    <ConfirmDialog
      open={confirmOpen}
      title={confirmOptions.title}
      description={confirmOptions.description}
      onConfirm={() => { if (confirmOptions.onConfirm) confirmOptions.onConfirm(); }}
      onClose={() => setConfirmOpen(false)}
      confirmText="Xóa"
      cancelText="Hủy"
    />
    </>
  );
}
