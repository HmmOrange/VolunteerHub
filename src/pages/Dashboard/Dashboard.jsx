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
      // (Lưu ý: Bạn cũng cần cập nhật hàm deleteEvent
      // để nó gửi 'slug' thay vì 'eventId' nếu backend đã đổi)
      await deleteEvent({ eventId, username });
      const data = await getAllEvents();
      setEvents(data);
    }
  };

  const handleEdit = (e, event) => {
    e.stopPropagation(); 
    setEditing(event._id); // Giữ lại _id để chỉnh sửa
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
    // (Lưu ý: Cập nhật hàm updateEvent để gửi 'slug' 
    // thay vì 'eventId' nếu backend đã đổi)
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
                
                <Card 
                  className="event-card-split event-card-clickable" 
                  onClick={() => {
                    if (editing !== event._id) {
                      
                      // === SỬA LỖI TẠI ĐÂY ===
                      // Đổi từ event._id thành event.slug
                      navigate(`/event/${event.slug}`);
                      // ======================
                      
                    }
                  }}
                >
                  <CardContent>
                    {editing === event._id ? (
                      <Box component="form" onSubmit={handleUpdate}>
                        <Stack spacing={2}>
                          {/* ... (Code form chỉnh sửa) ... */}
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