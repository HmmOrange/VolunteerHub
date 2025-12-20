import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../api/Events";
import {
  Box, Button, Container, TextField, Typography, Paper, Stack,
  Checkbox, FormControlLabel, MenuItem, FormControl, FormLabel, RadioGroup, Radio,
} from "@mui/material";

import "./CreateEvent.css";

const PRIMARY_COLOR = "#49BBBD";

export default function CreateEvent() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const [form, setForm] = useState({
    name: "",
    date: "",
    endDate: "",            // ✅ NEW
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    privacy: "Public",
    question: "",
    recurrence: {
      enabled: false,
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [],
      endDate: "",
    },
  });

  const toggleDay = (day) => {
    const days = form.recurrence.daysOfWeek;
    setForm({
      ...form,
      recurrence: {
        ...form.recurrence,
        daysOfWeek: days.includes(day)
          ? days.filter(d => d !== day)
          : [...days, day],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role !== "manager" && role !== "admin") {
      alert("Bạn cần là manager để tạo sự kiện.");
      return;
    }

    if (!username) {
      alert("Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    if (!form.endDate) {
      alert("Ngày kết thúc là bắt buộc.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      alert("Giờ bắt đầu và giờ kết thúc là bắt buộc.");
      return;
    }

    const startDateTime = new Date(`${form.date}T${form.startTime}`);
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`);

    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      alert("Thời gian không hợp lệ.");
      return;
    }

    if (endDateTime <= startDateTime) {
      alert("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }


    const payload = {
      ...form,
      recurrence: form.recurrence.enabled ? form.recurrence : null,
      username,
    };

    try {
      const res = await createEvent(payload);

      if (role === "admin") {
        alert("Sự kiện đã được tạo.");
        navigate(`/event/${res.slug}`);
      } else {
        alert("Sự kiện đã gửi chờ duyệt.");
        navigate("/events");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 12 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" mb={3} color={PRIMARY_COLOR}>
          Tạo sự kiện mới
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Tên sự kiện"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Ngày bắt đầu"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Ngày kết thúc"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Giờ bắt đầu"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Giờ kết thúc"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                fullWidth
              />
            </Stack>

            <TextField
              label="Địa điểm"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />

            <TextField
              label="Mô tả"
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            {/* ===== PRIVACY ===== */}
            <FormControl>
              <FormLabel>Quyền riêng tư</FormLabel>
              <RadioGroup
                row
                value={form.privacy}
                onChange={(e) => setForm({ ...form, privacy: e.target.value })}
              >
                <FormControlLabel value="Public" control={<Radio />} label="Công khai" />
                <FormControlLabel value="Private" control={<Radio />} label="Riêng tư" />
              </RadioGroup>
            </FormControl>

            {form.privacy === "Private" && (
              <TextField
                label="Câu hỏi cho thành viên"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
              />
            )}

            {/* ===== RECURRENCE (UNCHANGED) ===== */}
            <Box sx={{ border: "1px solid #e0e0e0", p: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.recurrence.enabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrence: { ...form.recurrence, enabled: e.target.checked },
                      })
                    }
                  />
                }
                label="Cài đặt sự kiện lặp lại"
              />

              {form.recurrence.enabled && (
                <Stack spacing={2}>
                  <TextField
                    select
                    label="Tần suất"
                    value={form.recurrence.frequency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrence: { ...form.recurrence, frequency: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="daily">Hàng ngày</MenuItem>
                    <MenuItem value="weekly">Hàng tuần</MenuItem>
                    <MenuItem value="monthly">Hàng tháng</MenuItem>
                  </TextField>

                  <TextField
                    label="Ngày kết thúc lặp"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={form.recurrence.endDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurrence: { ...form.recurrence, endDate: e.target.value },
                      })
                    }
                  />
                </Stack>
              )}
            </Box>

            <Button type="submit" variant="contained">
              Tạo sự kiện
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
