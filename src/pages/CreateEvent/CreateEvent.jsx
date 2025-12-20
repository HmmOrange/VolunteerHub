import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent, uploadBanner } from "../../api/Events";
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
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
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
    endDate: "",
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

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  /* ================= RECURRENCE HELPERS ================= */

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

  /* ================= SUBMIT ================= */

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

    if (!form.date || !form.endDate) {
      alert("Ngày bắt đầu và ngày kết thúc là bắt buộc.");
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

    if (form.recurrence.enabled && !form.recurrence.endDate) {
      alert("Vui lòng chọn ngày kết thúc lặp.");
      return;
    }

    const payload = {
      ...form,
      recurrence: form.recurrence.enabled ? form.recurrence : null,
      username,
    };

    try {
      const res = await createEvent(payload);

      // Upload banner nếu có
      if (bannerFile && res.slug) {
        try {
          await uploadBanner(res.slug, bannerFile);
        } catch (bannerErr) {
          console.error("Banner upload error:", bannerErr);
          // Không dừng tiến trình nếu upload banner lỗi
        }
      }

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
        <Typography
          variant="h5"
          textAlign="center"
          fontWeight="bold"
          mb={3}
          color={PRIMARY_COLOR}
        >
          Tạo sự kiện mới
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Tên sự kiện"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />

            {/* ===== DATE RANGE ===== */}
            <Stack direction="row" spacing={2} width="100%">
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
                required
                fullWidth
              />
            </Stack>

            {/* ===== TIME ===== */}
            <Stack direction="row" spacing={2} width="100%">
              <TextField
                label="Giờ bắt đầu"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                required
                fullWidth
              />

              <TextField
                label="Giờ kết thúc"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.endTime}
                onChange={(e) =>
                  setForm({ ...form, endTime: e.target.value })
                }
                required
                fullWidth
              />
            </Stack>

            <TextField
              label="Địa điểm"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
              required
              fullWidth
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
              fullWidth
            />

            {/* ===== BANNER UPLOAD ===== */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Banner sự kiện (không bắt buộc)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Ảnh phải nhỏ hơn 2MB
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: bannerPreview ? 2 : 0 }}
              >
                {bannerFile ? "Thay đổi banner" : "Chọn banner"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Kiểm tra kích thước file (2MB = 2 * 1024 * 1024 bytes)
                      const maxSize = 2 * 1024 * 1024;
                      if (file.size > maxSize) {
                        alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hưn 2MB.');
                        e.target.value = ''; // Reset input
                        return;
                      }
                      setBannerFile(file);
                      setBannerPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </Button>
              {bannerPreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: '150px',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* ===== PRIVACY ===== */}
            <FormControl>
              <FormLabel>Quyền riêng tư</FormLabel>
              <RadioGroup
                row
                value={form.privacy}
                onChange={(e) =>
                  setForm({ ...form, privacy: e.target.value })
                }
              >
                <FormControlLabel value="Public" control={<Radio />} label="Công khai" />
                <FormControlLabel value="Private" control={<Radio />} label="Riêng tư" />
              </RadioGroup>
            </FormControl>

            {form.privacy === "Private" && (
              <TextField
                label="Câu hỏi cho thành viên"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
                required
                fullWidth
              />
            )}

            {/* ===== RECURRENCE (FULL WIDTH FIXED) ===== */}
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                p: 2,
                borderRadius: 1,
                width: "100%",
              }}
            >
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
                    sx={{
                      color: PRIMARY_COLOR,
                      "&.Mui-checked": { color: PRIMARY_COLOR },
                    }}
                  />
                }
                label="Cài đặt sự kiện lặp lại"
              />

              {form.recurrence.enabled && (
                <Stack spacing={2} mt={2} width="100%">
                  <TextField
                    select
                    label="Tần suất"
                    size="small"
                    fullWidth
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
                    size="small"
                    fullWidth
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
                  />

                  {form.recurrence.frequency === "weekly" && (
                    <Box width="100%">
                      <Typography variant="caption" mb={1} display="block">
                        Chọn ngày trong tuần:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                          (label, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              variant={
                                form.recurrence.daysOfWeek.includes(idx)
                                  ? "contained"
                                  : "outlined"
                              }
                              onClick={() => toggleDay(idx)}
                              sx={{
                                minWidth: 36,
                                backgroundColor:
                                  form.recurrence.daysOfWeek.includes(idx)
                                    ? PRIMARY_COLOR
                                    : "transparent",
                                color: form.recurrence.daysOfWeek.includes(idx)
                                  ? "#fff"
                                  : PRIMARY_COLOR,
                                borderColor: PRIMARY_COLOR,
                              }}
                            >
                              {label}
                            </Button>
                          )
                        )}
                      </Stack>
                    </Box>
                  )}

                  <TextField
                    label="Ngày kết thúc lặp"
                    type="date"
                    size="small"
                    fullWidth
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
                    required
                  />
                </Stack>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: PRIMARY_COLOR,
                "&:hover": { backgroundColor: "#3aa6a8" },
              }}
            >
              Tạo sự kiện
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
