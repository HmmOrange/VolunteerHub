import { useEffect, useState } from "react";
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
} from "@mui/material";

import { getAllEvents, deleteEvent, updateEvent } from "../../api/Events";

export default function Events() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");
  // const role = localStorage.getItem("role"); // Không cần dùng role ở đây nữa

  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      setEvents(data);

      if (!userId) return;

      const joined = data.filter((event) => {
        if (!event.volunteers) return false;
        return event.volunteers.some((v) =>
          typeof v === "string"
            ? v === userId
            : v._id?.toString() === userId
        );
      });

      setJoinedEvents(joined);
    })();
  }, [userId]);

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

  const renderTime = (start, end) => {
    if (!start) return "Không rõ thời gian";
    return end ? `${start} – ${end}` : start;
  };

  return (
    <Container maxWidth="lg">
      {/* ================= JOINED EVENTS ================= */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, mt: 12 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Sự kiện bạn đã tham gia
        </Typography>

        {joinedEvents.length === 0 ? (
          <Typography color="text.secondary">
            Bạn chưa tham gia sự kiện nào
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {joinedEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card
                  className="event-card-clickable"
                  onClick={() => navigate(`/event/${event.slug}`)}
                  sx={{ bgcolor: '#f1f4f7' }}
                >
                  <CardContent>
                    <Typography variant="h6">{event.name}</Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {event.description}
                    </Typography>

                    <Typography variant="body2">
                      <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                    </Typography>

                    <Typography variant="body2">
                      <b>Ngày:</b>{" "}
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>

                    <Typography variant="body2">
                      <b>Thời gian:</b>{" "}
                      {renderTime(event.startTime, event.endTime)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* ================= ALL EVENTS ================= */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Tất cả sự kiện
        </Typography>

        {events.length === 0 ? (
          <Typography textAlign="center">
            Chưa có sự kiện nào.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => {
            // Logic: Chỉ Creator mới được phép thấy nút Sửa/Xóa
            const isCreator = event.createdBy?.username === username;

            return (
              <Grid item xs={12} sm={6} md={4} key={event._id} sx={{ mb: 4}}>
                <Card
                  className="event-card-clickable"
                  onClick={() => {
                    // Nếu là creator đang edit thì không navigate
                    if (editing !== event.slug) {
                      navigate(`/event/${event.slug}`);
                    }
                  }}
                  sx={{ bgcolor: '#f1f4f7' }}
                >
                  <CardContent>
                    {editing === event.slug ? (
                      /* FORM CHỈNH SỬA */
                      <Box component="form" onSubmit={handleUpdate}>
                        <Stack spacing={2}>
                          <TextField
                            label="Tên sự kiện"
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            required
                          />

                          <TextField
                            label="Ngày"
                            type="date"
                            value={form.date}
                            onChange={(e) =>
                              setForm({ ...form, date: e.target.value })
                            }
                            InputLabelProps={{ shrink: true }}
                            required
                          />

                          <TextField
                            label="Giờ bắt đầu"
                            type="time"
                            value={form.startTime}
                            onChange={(e) =>
                              setForm({ ...form, startTime: e.target.value })
                            }
                            InputLabelProps={{ shrink: true }}
                            required
                          />

                          <TextField
                            label="Giờ kết thúc"
                            type="time"
                            value={form.endTime}
                            onChange={(e) =>
                              setForm({ ...form, endTime: e.target.value })
                            }
                            InputLabelProps={{ shrink: true }}
                          />

                          <TextField
                            label="Địa điểm"
                            value={form.location}
                            onChange={(e) =>
                              setForm({ ...form, location: e.target.value })
                            }
                          />

                          <TextField
                            label="Mô tả"
                            value={form.description}
                            onChange={(e) =>
                              setForm({ ...form, description: e.target.value })
                            }
                            multiline
                            rows={3}
                          />

                          <Button type="submit" variant="contained">
                            Lưu
                          </Button>
                          <Button onClick={handleCancelEdit}>Hủy</Button>
                        </Stack>
                      </Box>
                    ) : (
                      /* THÔNG TIN HIỂN THỊ */
                      <>
                        <Typography variant="h6">{event.name}</Typography>

                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {event.description}
                        </Typography>

                        <Typography variant="body2">
                          <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                        </Typography>

                        <Typography variant="body2">
                          <b>Ngày:</b>{" "}
                          {new Date(event.date).toLocaleDateString()}
                        </Typography>

                        <Typography variant="body2">
                          <b>Thời gian:</b>{" "}
                          {renderTime(event.startTime, event.endTime)}
                        </Typography>

                        <Typography variant="caption" display="block" mt={1}>
                          Người tạo: {event.createdBy?.username || "Không rõ"}
                        </Typography>

                        <Typography variant="caption" display="block">
                          Đã duyệt: {event.approved ? "✅" : "❌"}
                        </Typography>
                      </>
                    )}
                  </CardContent>

                  {/* CHỈ CREATOR MỚI THẤY CARD ACTIONS (SỬA/XÓA) */}
                  {isCreator && editing !== event.slug && (
                    <CardActions>
                      <Button
                        variant="outlined"
                        onClick={(e) => handleEdit(e, event)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="contained"
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
          })}
        </Grid>
        )}
      </Paper>
    </Container>
  );
}