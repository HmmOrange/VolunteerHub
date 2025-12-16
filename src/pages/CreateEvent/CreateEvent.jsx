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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import "./CreateEvent.css";

const PRIMARY_COLOR = "#49BBBD";

export default function CreateEvent() {
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
    privacy: "Public",
    question: "",
  });

  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role !== "manager") {
      alert("Bạn cần là manager để tạo sự kiện.");
      return;
    }

    const res = await createEvent({
      ...form,
      username,
    });

    if (res?.message?.includes("thành công")) {
      navigate("/dashboard");
    }
  };

  return (
    <Container maxWidth="sm" className="create-event-container-split">
      <Paper elevation={3} className="create-event-paper-split">
        <Typography
          variant="h5"
          textAlign="center"
          fontWeight="bold"
          mb={3}
        >
          Tạo sự kiện mới
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Tên sự kiện */}
            <TextField
              label="Tên sự kiện"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
              fullWidth
            />

            {/* Ngày */}
            <TextField
              label="Ngày tổ chức"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              required
              fullWidth
            />

            {/* Địa điểm */}
            <TextField
              label="Địa điểm"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
              fullWidth
            />

            {/* Mô tả */}
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

            {/* 🔐 QUYỀN RIÊNG TƯ */}
            <FormControl>
              <FormLabel>
                Quyền riêng tư
              </FormLabel>

              <RadioGroup
                row
                value={form.privacy}
                onChange={(e) =>
                  setForm({ ...form, privacy: e.target.value })
                }
              >
                <FormControlLabel
                  value="Public"
                  label="Công khai"
                  control={
                    <Radio
                      sx={{
                        color: PRIMARY_COLOR,
                        "&.Mui-checked": {
                          color: PRIMARY_COLOR,
                        },
                      }}
                    />
                  }
                />
                <FormControlLabel
                  value="Private"
                  label="Riêng tư"
                  control={
                    <Radio
                      sx={{
                        color: PRIMARY_COLOR,
                        "&.Mui-checked": {
                          color: PRIMARY_COLOR,
                        },
                      }}
                    />
                  }
                />
              </RadioGroup>
            </FormControl>

            {/* ❓ CÂU HỎI */}
            {form.privacy === "Private" && (
              <TextField
                label="Câu hỏi cho thành viên"
                placeholder="Ví dụ: Tại sao bạn muốn tham gia sự kiện này?"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
                fullWidth
              />
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: PRIMARY_COLOR,
                "&:hover": {
                  backgroundColor: "#3aa6a8",
                },
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
