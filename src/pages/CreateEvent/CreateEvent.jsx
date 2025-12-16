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
  Checkbox,
  FormControlLabel,
  MenuItem,
} from "@mui/material";

import "./CreateEvent.css";

const PRIMARY_COLOR = "#49BBBD";

export default function CreateEvent() {
  const [form, setForm] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    recurrence: {
      enabled: false,
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [],
      endDate: "",
    },
  });

  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const toggleDay = (day) => {
    const days = form.recurrence.daysOfWeek;
    setForm({
      ...form,
      recurrence: {
        ...form.recurrence,
        daysOfWeek: days.includes(day)
          ? days.filter((d) => d !== day)
          : [...days, day],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role !== "manager") {
      alert("Bạn cần là manager để tạo sự kiện.");
      return;
    }

    const payload = {
      ...form,
      recurrence: form.recurrence.enabled ? form.recurrence : null,
      username,
    };

    const res = await createEvent(payload);
    if (res?.message?.includes("thành công")) {
      navigate("/dashboard");
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" mb={3}>
          Tạo sự kiện mới
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Tên sự kiện"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <TextField
              label="Ngày bắt đầu"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              required
            />

            <TextField
              label="Giờ bắt đầu"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.startTime}
              onChange={(e) =>
                setForm({ ...form, startTime: e.target.value })
              }
              required
            />

            <TextField
              label="Giờ kết thúc (tuỳ chọn)"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={form.endTime}
              onChange={(e) =>
                setForm({ ...form, endTime: e.target.value })
              }
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
              multiline
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />

            {/* RECURRENCE */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.recurrence.enabled}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrence: {
                        ...form.recurrence,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Sự kiện lặp lại"
            />

            {form.recurrence.enabled && (
              <>
                <TextField
                  select
                  label="Tần suất"
                  value={form.recurrence.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrence: {
                        ...form.recurrence,
                        frequency: e.target.value,
                      },
                    })
                  }
                >
                  <MenuItem value="daily">Hàng ngày</MenuItem>
                  <MenuItem value="weekly">Hàng tuần</MenuItem>
                  <MenuItem value="monthly">Hàng tháng</MenuItem>
                </TextField>

                <TextField
                  label="Lặp lại mỗi"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.recurrence.interval}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrence: {
                        ...form.recurrence,
                        interval: Number(e.target.value),
                      },
                    })
                  }
                  helperText="Ví dụ: mỗi 2 tuần"
                />

                {form.recurrence.frequency === "weekly" && (
                  <Stack direction="row" spacing={1}>
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                      (label, idx) => (
                        <Button
                          key={idx}
                          variant={
                            form.recurrence.daysOfWeek.includes(idx)
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() => toggleDay(idx)}
                        >
                          {label}
                        </Button>
                      )
                    )}
                  </Stack>
                )}

                <TextField
                  label="Ngày kết thúc (tuỳ chọn)"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.recurrence.endDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrence: {
                        ...form.recurrence,
                        endDate: e.target.value,
                      },
                    })
                  }
                />
              </>
            )}

            <Button type="submit" variant="contained" size="large">
              Tạo sự kiện
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
