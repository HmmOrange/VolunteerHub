import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllEvents, deleteEvent, updateEvent } from "../../api/Events";
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

// Import file CSS tương ứng
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate(); 
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null); // State này giờ sẽ lưu 'slug'
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      setEvents(data);
    })();
  }, []);

  // === 1. SỬA HÀM NÀY ===
  // Đổi 'eventId' thành 'slug'
  const handleDelete = async (e, slug) => {
    e.stopPropagation(); 
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này?")) {
      // Gửi 'slug' thay vì 'eventId'
      await deleteEvent({ slug, username }); 
      const data = await getAllEvents();
      setEvents(data);
    }
  };

  // === 2. SỬA HÀM NÀY ===
  const handleEdit = (e, event) => {
    e.stopPropagation(); 
    setEditing(event.slug); // Lưu 'slug' vào state editing
    setForm({
      name: event.name,
      date: event.date.split("T")[0],
      location: event.location,
      description: event.description,
    });
  };

  // === 3. SỬA HÀM NÀY ===
  const handleUpdate = async (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    // Gửi 'slug: editing' thay vì 'eventId: editing'
    await updateEvent({ ...form, username, slug: editing }); 
    
    setEditing(null);
    const data = await getAllEvents();
    setEvents(data);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditing(null);
  };

  return (
    <>
      <Container maxWidth="md" className="dashboard-container-split">
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
          Xin chào, {username || "Người dùng"}!
        </Typography>
        <Typography variant="h6" textAlign="center" mb={3}>
          Danh sách sự kiện
        </Typography>

        {events.length === 0 ? (
          <Typography textAlign="center">Chưa có sự kiện nào.</Typography>
        ) : (
          <Grid container spacing={3} className="event-grid-container-split">
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                
                {/* === 4. SỬA SO SÁNH (dùng slug) === */}
                <Card 
                  className="event-card-split event-card-clickable" 
                  onClick={() => {
                    // So sánh 'editing' (slug) với 'event.slug'
                    if (editing !== event.slug) { 
                      navigate(`/event/${event.slug}`);
                    }
                  }}
                >
                  <CardContent>
                    {/* So sánh 'editing' (slug) với 'event.slug' */}
                    {editing === event.slug ? ( 
                      <Box component="form" onSubmit={handleUpdate}>
                        <Stack spacing={2}>
                          <TextField
                            label="Tên sự kiện"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                          />
                          <TextField
                            label="Ngày"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                          <TextField
                            label="Địa điểm"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                          />
                          <TextField
                            label="Mô tả"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            multiline
                            rows={3}
                          />
                          <Button type="submit" variant="contained">Lưu</Button>
                          <Button onClick={handleCancelEdit}>Hủy</Button>
                        </Stack>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="h6">{event.name}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {event.description}
                        </Typography>
                        <Typography variant="body2">
                          <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                        </Typography>
                        <Typography variant="body2">
                          <b>Ngày:</b> {new Date(event.date).toLocaleDateString()}
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

                  {(role === "manager" ||
                    event.createdBy?.username === username) && (
                    <CardActions className="event-actions-split">
                      {/* So sánh 'editing' (slug) với 'event.slug' */}
                      {editing === event.slug ? null : ( 
                        <>
                          <Button
                            variant="outlined"
                            onClick={(e) => handleEdit(e, event)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            // Gửi 'event.slug' cho hàm handleDelete
                            onClick={(e) => handleDelete(e, event.slug)} 
                          >
                            Xóa
                          </Button>
                        </>
                      )}
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}