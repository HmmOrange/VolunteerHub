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
  const [editing, setEditing] = useState(null);
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

  const handleDelete = async (e, eventId) => {
    e.stopPropagation(); 
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này?")) {
      await deleteEvent({ eventId, username });
      const data = await getAllEvents();
      setEvents(data);
    }
  };

  const handleEdit = (e, event) => {
    e.stopPropagation(); 
    setEditing(event._id);
    setForm({
      name: event.name,
      date: event.date.split("T")[0],
      location: event.location,
      description: event.description,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    await updateEvent({ ...form, username, eventId: editing });
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
        {/* === ĐÃ SỬA LỖI 1 TẠI ĐÂY === */}
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
          Xin chào, {username || "Người dùng"}!
        </Typography>
        {/* === ĐÃ SỬA LỖI 2 TẠI ĐÂY === */}
        <Typography variant="h6" textAlign="center" mb={3}>
          Danh sách sự kiện
        </Typography>

        {events.length === 0 ? (
          <Typography textAlign="center">Chưa có sự kiện nào.</Typography>
        ) : (
          <Grid container spacing={3} className="event-grid-container-split">
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                
                <Card 
                  className="event-card-split event-card-clickable" 
                  onClick={() => {
                    if (editing !== event._id) {
                      navigate(`/event/${event._id}`);
                    }
                  }}
                >
                  <CardContent>
                    {editing === event._id ? (
                      <Box component="form" onSubmit={handleUpdate}>
                        <Stack spacing={2}>
                          <TextField label="Tên sự kiện" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth onClick={(e) => e.stopPropagation()} />
                          <TextField label="Ngày" type="date" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required fullWidth onClick={(e) => e.stopPropagation()} />
                          <TextField label="Địa điểm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} fullWidth onClick={(e) => e.stopPropagation()} />
                          <TextField label="Mô tả" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth onClick={(e) => e.stopPropagation()} />
                          <Stack direction="row" spacing={2}>
                            <Button variant="contained" type="submit">Lưu</Button>
                            <Button variant="outlined" color="error" onClick={handleCancelEdit}>Hủy</Button>
                          </Stack>
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
                        
                        {/* === ĐÃ SỬA LỖI 3 TẠI ĐÂY === */}
                        <Typography variant="body2">
                          <b>Ngày:</b> {new Date(event.date).toLocaleDateString()}
                        </Typography>
                        
                        {/* === ĐÃ SỬA LỖI 4 TẠI ĐÂY === */}
                        <Typography variant="caption" display="block" mt={1}>
                          Người tạo: {event.createdBy?.username || "Không rõ"}
                        </Typography>
                        
                        {/* === ĐÃ SỬA LỖI 5 TẠI ĐÂY === */}
                        <Typography variant="caption" display="block">
                          Đã duyệt: {event.approved ? "✅" : "❌"}
                        </Typography>
                      </>
                    )}
                  </CardContent>

                  {(role === "manager" ||
                    event.createdBy?.username === username) && (
                    <CardActions className="event-actions-split">
                      {editing === event._id ? null : (
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
                            onClick={(e) => handleDelete(e, event._id)}
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