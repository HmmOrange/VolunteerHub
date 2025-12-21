import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
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
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ConfirmDialog from "../../components/common/ConfirmDialog";

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

/*
  Page: `AdminEventList`

  Mô tả:
  - Trang quản trị danh sách sự kiện: xem tất cả sự kiện (admin), duyệt/từ chối, và xuất dữ liệu.
  - Hàm lớn: `fetchData` để lấy events admin, `handleApprove`, `handleReject`, `handleExport`.
  - Yêu cầu: chỉ admin mới truy cập được trang này.
*/

export default function AdminEventList() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== EXPORT STATE =====
  const [exportType, setExportType] = useState("csv");
  // pagination / details state (must be declared unconditionally)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({ title: '', description: '', onConfirm: null });
  // === HÀM TÍNH TRẠNG THÁI TỰ ĐỘNG ===
  const calculateEventStatus = (event) => {
    if (!event) return 'upcoming';
    
    // Chỉ giữ trạng thái cancelled nếu đã bị hủy
    if (event.eventStatus === 'cancelled') return 'cancelled';
    
    // Còn lại tất cả dựa vào thời gian thực tế
    const now = new Date();
    const startDate = new Date(event.date);
    if (event.startTime) {
      const [h, m] = event.startTime.split(':');
      startDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    const endDate = new Date(event.endDate || event.date);
    if (event.endTime) {
      const [h, m] = event.endTime.split(':');
      endDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  // ===== FETCH EVENTS =====
  const fetchData = async () => {
    setLoading(true);
    try {
      // Sử dụng endpoint admin để lấy tất cả events
      const res = await fetch(`${API_BASE}/admin/all`, {
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
      showToast("Không có sự kiện để xuất.", "info");
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
    setConfirmOptions({
      title: 'Duyệt sự kiện',
      description: 'Xác nhận duyệt sự kiện này?',
      onConfirm: async () => {
        await fetch(`${API_BASE}/admin/${eventId}/approved`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchData();
      }
    });
    setConfirmOpen(true);
  };

  const handleReject = async (eventId) => {
    setConfirmOptions({
      title: 'Từ chối sự kiện',
      description: 'Từ chối sự kiện này?',
      onConfirm: async () => {
        await fetch(`${API_BASE}/admin/${eventId}/rejected`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchData();
      }
    });
    setConfirmOpen(true);
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

  const renderEventTable = (events, showActions = false) => {
    const eventStatusMap = {
      upcoming: "Sắp diễn ra",
      ongoing: "Đang diễn ra",
      completed: "Đã hoàn thành",
      cancelled: "Đã bị hủy"
    };

    return (
      <Table size="small">
        <TableHead>
          <TableRow className="table-header">
            <TableCell width="30%">Tên sự kiện</TableCell>
            <TableCell width="18%">Người tạo</TableCell>
            <TableCell width="12%">Ngày</TableCell>
            <TableCell width="15%">Địa điểm</TableCell>
            <TableCell width="8%">Riêng tư</TableCell>
            <TableCell width="10%">Phê duyệt</TableCell>
            <TableCell width="7%">Trạng thái</TableCell>
            {showActions && <TableCell align="right">Hành động</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e._id} hover sx={{ cursor: 'pointer' }} onClick={() => openEventDetails(e)}>
              <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</TableCell>
              <TableCell>{e.createdBy?.username}</TableCell>
              <TableCell>{new Date(e.date).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location}</TableCell>
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
              <TableCell>
                <Chip
                  size="small"
                  label={eventStatusMap[calculateEventStatus(e)]}
                  color={
                    calculateEventStatus(e) === "ongoing"
                      ? "success"
                      : calculateEventStatus(e) === "completed"
                      ? "default"
                      : calculateEventStatus(e) === "cancelled"
                      ? "error"
                      : "info"
                  }
                />
              </TableCell>

              {showActions && (
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="contained" color="success" onClick={(ev) => { ev.stopPropagation(); handleApprove(e._id); }}>Duyệt</Button>
                    <Button size="small" variant="outlined" color="error" onClick={(ev) => { ev.stopPropagation(); handleReject(e._id); }}>Từ chối</Button>
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // ===== PAGINATION + DETAILS HANDLERS =====
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const openEventDetails = (event) => { setSelectedEvent(event); setDetailOpen(true); };
  const closeEventDetails = () => { setSelectedEvent(null); setDetailOpen(false); };

  const renderPaginatedTable = (items, showActions = false, keyPrefix = 'table') => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = items.slice(start, end);

    return (
      <>
        <TableContainer>
          {renderEventTable(pageItems, showActions)}
        </TableContainer>

        <TablePagination
          component="div"
          count={items.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </>
    );
  };

  // Details dialog content
  const EventDetailsDialog = () => (
    <Dialog open={detailOpen} onClose={closeEventDetails} fullWidth maxWidth="md">
      <DialogTitle>
        {selectedEvent?.name}
        <IconButton aria-label="close" onClick={closeEventDetails} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {selectedEvent ? (
          <Box>
            <Box sx={{ mb: 2 }}>
              <img src={selectedEvent.banner ? (selectedEvent.banner.startsWith('http') ? selectedEvent.banner : `http://localhost:5000${selectedEvent.banner}`) : ''} alt="banner" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 6 }} />
            </Box>

            <Typography variant="subtitle1"><b>Người tạo:</b> {selectedEvent.createdBy?.username}</Typography>
            <Typography variant="subtitle1"><b>Ngày bắt đầu:</b> {new Date(selectedEvent.date).toLocaleString('vi-VN')}</Typography>
            <Typography variant="subtitle1"><b>Ngày kết thúc:</b> {selectedEvent.endDate ? new Date(selectedEvent.endDate).toLocaleString('vi-VN') : '-'}</Typography>
            <Typography variant="subtitle1"><b>Địa điểm:</b> {selectedEvent.location || '-'}</Typography>
            <Typography variant="subtitle1" sx={{ mt: 2 }}><b>Mô tả:</b></Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.description || '-'}</Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEventDetails}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
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
          renderPaginatedTable(pendingEvents, true, 'pending')
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
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#49BBBD' }, '& .MuiSvgIcon-root': { color: 'inherit' } }}
              MenuProps={{ PaperProps: { sx: { '& .Mui-selected': { color: '#49BBBD !important', backgroundColor: 'rgba(73,187,189,0.06) !important' } } } }}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleExport} sx={{ bgcolor: '#49BBBD', '&:hover': { bgcolor: '#359698' } }}>
            Xuất
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {allEvents.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            Chưa có sự kiện nào.
          </Typography>
        ) : (
          renderPaginatedTable(allEvents, false, 'all')
        )}
      </Paper>
      {EventDetailsDialog()}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmOptions.title}
        description={confirmOptions.description}
        onConfirm={() => { if (confirmOptions.onConfirm) confirmOptions.onConfirm(); }}
        onClose={() => setConfirmOpen(false)}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </Container>
    </>
  );
}
