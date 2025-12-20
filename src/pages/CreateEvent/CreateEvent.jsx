import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../api/Events";
import {
  Box, Button, Container, TextField, Typography, Paper, Stack,
  Checkbox, FormControlLabel, MenuItem, FormControl, FormLabel, RadioGroup, Radio,
  Alert
} from "@mui/material";

import "./CreateEvent.css";

const PRIMARY_COLOR = "#49BBBD";

export default function CreateEvent() {
  const navigate = useNavigate();
  
  // Lấy username và role từ localStorage
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const [form, setForm] = useState({
    name: "",
    date: "",
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

  // Toggle ngày trong tuần
  const toggleDay = (day) => {
    const days = form.recurrence.daysOfWeek;
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
      
    setForm({
      ...form,
      recurrence: { ...form.recurrence, daysOfWeek: newDays },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate quyền Manager (Frontend check)
    if (role !== "manager") {
      alert("Bạn cần là manager để tạo sự kiện.");
      return;
    }

    // 2. Validate User (Quan trọng: Nguyên nhân hay gây lỗi 400)
    if (!username) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    // 3. Validate Logic Giờ (Frontend check trước khi gửi)
    if (form.endTime && form.startTime) {
        if (form.endTime <= form.startTime) {
            alert("Giờ kết thúc phải sau giờ bắt đầu!");
            return;
        }
    }

    // 4. Chuẩn bị Payload
    const payload = {
      ...form,
      recurrence: form.recurrence.enabled ? form.recurrence : null,
      username: username, // Gửi username lên để backend tìm user._id
    };

    try {
      // Gọi API
      const res = await createEvent(payload);
      
      // Nếu thành công (API không throw error)
      alert("Tạo sự kiện thành công!");
      navigate(`/event/${res.slug}`); // Chuyển hướng thẳng đến trang chi tiết event vừa tạo
    } catch (error) {
      // Bắt lỗi 400 từ backend và hiển thị
      console.error("Create Event Failed:", error);
      alert(`Thất bại: ${error.message}`); 
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 12, mb: 4 }}>
        <Typography variant="h5" textAlign="center" fontWeight="bold" mb={3} color={PRIMARY_COLOR}>
          Tạo sự kiện mới
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* --- THÔNG TIN CƠ BẢN --- */}
            <TextField
              label="Tên sự kiện"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required fullWidth
            />

            <TextField
              label="Ngày bắt đầu"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Giờ bắt đầu"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required fullWidth
              />
              <TextField
                label="Giờ kết thúc (tuỳ chọn)"
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
              required fullWidth
            />

            <TextField
              label="Mô tả"
              multiline rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required fullWidth
            />

            {/* --- QUYỀN RIÊNG TƯ --- */}
            <FormControl>
              <FormLabel id="privacy-label">Quyền riêng tư</FormLabel>
              <RadioGroup
                row
                aria-labelledby="privacy-label"
                value={form.privacy}
                onChange={(e) => setForm({ ...form, privacy: e.target.value })}
              >
                <FormControlLabel
                  value="Public" label="Công khai"
                  control={<Radio sx={{ color: PRIMARY_COLOR, "&.Mui-checked": { color: PRIMARY_COLOR } }} />}
                />
                <FormControlLabel
                  value="Private" label="Riêng tư"
                  control={<Radio sx={{ color: PRIMARY_COLOR, "&.Mui-checked": { color: PRIMARY_COLOR } }} />}
                />
              </RadioGroup>
            </FormControl>

            {form.privacy === "Private" && (
              <TextField
                label="Câu hỏi cho thành viên"
                placeholder="Ví dụ: Tại sao bạn muốn tham gia sự kiện này?"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                fullWidth required // Bắt buộc nếu là Private
              />
            )}

            {/* --- RECURRENCE (Lặp lại) --- */}
            <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={form.recurrence.enabled}
                    onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, enabled: e.target.checked } })}
                    sx={{ color: PRIMARY_COLOR, "&.Mui-checked": { color: PRIMARY_COLOR } }}
                    />
                }
                label="Cài đặt sự kiện lặp lại"
                />

                {form.recurrence.enabled && (
                <Stack spacing={2} sx={{ mt: 2}}>
                    <TextField
                    select label="Tần suất" size="small"
                    value={form.recurrence.frequency}
                    onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, frequency: e.target.value } })}
                    >
                    <MenuItem value="daily">Hàng ngày</MenuItem>
                    <MenuItem value="weekly">Hàng tuần</MenuItem>
                    <MenuItem value="monthly">Hàng tháng</MenuItem>
                    </TextField>

                    <TextField
                    label="Lặp lại mỗi (Interval)"
                    type="number" size="small"
                    inputProps={{ min: 1 }}
                    value={form.recurrence.interval}
                    onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, interval: Number(e.target.value) } })}
                    helperText={`Ví dụ: ${form.recurrence.frequency === 'weekly' ? '2 tuần 1 lần' : '1 lần'}`}
                    />

                    {form.recurrence.frequency === "weekly" && (
                    <Box>
                        <Typography variant="caption" display="block" mb={1}>Chọn ngày trong tuần:</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((label, idx) => (
                            <Button
                            key={idx} size="small"
                            variant={form.recurrence.daysOfWeek.includes(idx) ? "contained" : "outlined"}
                            onClick={() => toggleDay(idx)}
                            sx={{
                                minWidth: "35px", mb: 1,
                                backgroundColor: form.recurrence.daysOfWeek.includes(idx) ? PRIMARY_COLOR : 'transparent',
                                color: form.recurrence.daysOfWeek.includes(idx) ? '#fff' : PRIMARY_COLOR,
                                borderColor: PRIMARY_COLOR,
                                '&:hover': {
                                    backgroundColor: form.recurrence.daysOfWeek.includes(idx) ? '#3aa6a8' : 'rgba(73, 187, 189, 0.1)',
                                    borderColor: PRIMARY_COLOR
                                }
                            }}
                            >
                            {label}
                            </Button>
                        ))}
                        </Stack>
                    </Box>
                    )}

                    <TextField
                    label="Ngày kết thúc lặp"
                    type="date" size="small"
                    InputLabelProps={{ shrink: true }}
                    value={form.recurrence.endDate}
                    onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, endDate: e.target.value } })}
                    />
                </Stack>
                )}
            </Box>

            <Button
              type="submit"
              variant="contained" size="large"
              sx={{ backgroundColor: PRIMARY_COLOR, "&:hover": { backgroundColor: "#3aa6a8" } }}
            >
              Tạo sự kiện
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}