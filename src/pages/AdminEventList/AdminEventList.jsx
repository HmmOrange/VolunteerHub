import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  Stack,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";

const API_BASE = "http://localhost:5000/api/events";

/* ================= EXPORT HELPERS ================= */

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const eventsToCSV = (events) => {
  const headers = [
    "name",
    "createdBy",
    "date",
    "location",
    "privacy",
    "status",
  ];

  const rows = events.map((e) =>
    [
      e.name,
      e.createdBy?.username || "",
      e.date,
      e.location || "",
      e.privacy,
      e.status,
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
};

export default function AdminEventList() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== EXPORT STATE =====
  const [exportType, setExportType] = useState("csv");

  // ===== FETCH EVENTS =====
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch events");

      const events = await res.json();

      setAllEvents(events);
      setPendingEvents(events.filter((e) => e.status === "pending"));
    } catch (err) {
      console.error("AdminEventList error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchData();
    }
  }, [role]);

  // ===== EXPORT =====
  const handleExport = () => {
    if (allEvents.length === 0) {
      alert("Không có sự kiện để export.");
      return;
    }

    if (exportType === "json") {
      downloadFile(
        JSON.stringify(allEvents, null, 2),
        "events.json",
        "application/json"
      );
    } else {
      downloadFile(eventsToCSV(allEvents), "events.csv", "text/csv");
    }
  };

  // ===== ACTIONS =====
  const handleApprove = async (eventId) => {
    if (!window.confirm("Xác nhận duyệt sự kiện này?")) return;

    await fetch(`${API_BASE}/admin/${eventId}/approved`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  const handleReject = async (eventId) => {
    if (!window.confirm("Từ chối sự kiện này?")) return;

    await fetch(`${API_BASE}/admin/${eventId}/rejected`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };

  if (role !== "admin") {
    return (
      <Typography sx={{ p: 4, color: "error.main" }}>
        Bạn không có quyền truy cập trang này.
      </Typography>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const renderEventTable = (events, showActions = false) => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tên sự kiện</TableCell>
          <TableCell>Người tạo</TableCell>
          <TableCell>Ngày</TableCell>
          <TableCell>Địa điểm</TableCell>
          <TableCell>Riêng tư</TableCell>
          <TableCell>Trạng thái</TableCell>
          {showActions && <TableCell align="right">Hành động</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {events.map((e) => (
          <TableRow key={e._id}>
            <TableCell>{e.name}</TableCell>
            <TableCell>{e.createdBy?.username}</TableCell>
            <TableCell>
              {new Date(e.date).toLocaleDateString("vi-VN")}
            </TableCell>
            <TableCell>{e.location}</TableCell>
            <TableCell>{e.privacy}</TableCell>
            <TableCell>
              <Chip
                size="small"
                label={
                  e.status === "approved"
                    ? "Đã duyệt"
                    : e.status === "rejected"
                    ? "Từ chối"
                    : "Chờ duyệt"
                }
                color={
                  e.status === "approved"
                    ? "success"
                    : e.status === "rejected"
                    ? "error"
                    : "warning"
                }
              />
            </TableCell>

            {showActions && (
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleApprove(e._id)}
                  >
                    Duyệt
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleReject(e._id)}
                  >
                    Từ chối
                  </Button>
                </Stack>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* ===== PENDING EVENTS ===== */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Sự kiện chờ duyệt
      </Typography>

      <Paper variant="outlined">
        {pendingEvents.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Không có sự kiện nào đang chờ duyệt.
          </Typography>
        ) : (
          renderEventTable(pendingEvents, true)
        )}
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* ===== ALL EVENTS + EXPORT ===== */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Tất cả sự kiện
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small">
            <Select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleExport}>
            Export
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {allEvents.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Chưa có sự kiện nào.
          </Typography>
        ) : (
          renderEventTable(allEvents, false)
        )}
      </Paper>
    </Container>
  );
}
