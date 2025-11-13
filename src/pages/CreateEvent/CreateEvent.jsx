import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../api/Events";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stack,
} from "@mui/material";

import "./CreateEvent.css";

export default function CreateEvent() {
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
  });

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createEvent({ ...form, username });
    if (res.message && res.message.includes("thành công")) {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <Container maxWidth="sm" className="create-event-container-split">
        <Paper elevation={3} className="create-event-paper-split">
          <Typography
            variant="h5"
            component="h2"
            textAlign="center"
            fontWeight="bold"
            mb={3}
          >
            Tạo sự kiện mới
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Tên sự kiện"
                variant="outlined"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Ngày tổ chức"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Địa điểm"
                variant="outlined"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                fullWidth
              />

              <TextField
                label="Mô tả"
                variant="outlined"
                multiline
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                className="create-event-submit-btn-split"
              >
                Tạo sự kiện
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </>
  );
}