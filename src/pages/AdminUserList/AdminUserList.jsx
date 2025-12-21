import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Button,
  Modal,
  Box,
  TextField,
  Stack,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import { useToast } from "../../context/ToastContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";

import {
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  createManager,
} from "../../api/Users";

import "./UserList.css";
import ImportExport from "./ImportExport";

/* ================= MODAL STYLE ================= */
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

/*
  Page: `AdminUserList`

  Mô tả:
  - Giao diện quản trị danh sách người dùng: tìm kiếm, phân trang, thay đổi vai trò, khóa/mở khóa, xuất dữ liệu và import (qua component `ImportExport`).
  - Hàm lớn/quan trọng: `fetchUsers`, `handleRoleChange`, `handleToggleBan`, `handleCreateManager`, `handleExportUsers`.
  - Chú ý: các thao tác gọi API nằm trong `src/api/Users`.
*/

export default function AdminUserList() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [exportType, setExportType] = useState('csv');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState({ title: '', description: '', onConfirm: null });

  /* ===== MODAL STATE ===== */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const currentUserRole = localStorage.getItem("role");
  const currentUsername = localStorage.getItem("username");

  /* ================= FETCH ================= */

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT HELPERS (for right-side quick export) ================= */
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const usersToCSV = (usersList) => {
    const headers = [
      'username','email','fullName','dateOfBirth','address','avatar','role','isLocked','isEmailVerified'
    ];

    const rows = usersList.map(u => [
      u.username || '',
      u.email || '',
      u.fullName || '',
      u.dateOfBirth || '',
      u.address || '',
      u.avatar || '',
      u.role || 'volunteer',
      u.isLocked ?? false,
      u.isEmailVerified ?? false,
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      showToast('Không có user để export.', 'info');
      return;
    }

    if (exportType === 'json') {
      downloadFile(JSON.stringify(users, null, 2), 'users.json', 'application/json');
    } else {
      downloadFile(usersToCSV(users), 'users.csv', 'text/csv');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= ACTIONS ================= */

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "volunteer" ? "manager" : "volunteer";
    setConfirmOptions({
      title: 'Thay đổi vai trò',
      description: 'Xác nhận thay đổi vai trò?',
      onConfirm: async () => {
        try {
          await updateUserRole(userId, newRole);
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, role: newRole } : u
            )
          );
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
    setConfirmOpen(true);
  };

  const handleToggleBan = async (userId) => {
    setConfirmOptions({
      title: 'Khóa / Mở khóa',
      description: 'Xác nhận khóa / mở khóa tài khoản?',
      onConfirm: async () => {
        try {
          const res = await toggleUserLock(userId);
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, isLocked: res.user.isLocked } : u
            )
          );
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
    setConfirmOpen(true);
  };

  /* ================= CREATE MANAGER ================= */

  const handleCreateManager = async () => {
    const { username, email, fullName, password, confirmPassword } = form;

    if (!username || !email || !password || !confirmPassword) {
      showToast("Username, email và mật khẩu là bắt buộc.", 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast("Mật khẩu nhập lại không khớp.", 'warning');
      return;
    }

    try {
      await createManager({
        username,
        email,
        password,
        fullName,
      });

      showToast("Tạo tài khoản Manager thành công.", 'success');
      setOpen(false);
      setForm({
        username: "",
        email: "",
        fullName: "",
        password: "",
        confirmPassword: "",
      });
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (currentUserRole !== "admin") {
    return (
      <Typography sx={{ p: 3, color: "error.main" }}>
        Bạn không có quyền truy cập trang này.
      </Typography>
    );
  }

  const roleLabel = (role) =>
    role === "admin"
      ? "Admin"
      : role === "manager"
      ? "Quản lý"
      : "Thành viên";

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const openUserDetails = (user) => { setSelectedUser(user); setDetailOpen(true); };
  const closeUserDetails = () => { setSelectedUser(null); setDetailOpen(false); };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.fullName || '').toLowerCase().includes(q);
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
    <Container maxWidth="md" className="user-list-container">
      <Divider sx={{ mb: 3 }} />

      {/* ===== HEADER ===== */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" className="user-list-title">
          Danh sách người dùng
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
            sx={{ bgcolor: '#49BBBD', color: "white", '&:hover': { bgcolor: '#359698' } }}
        >
          Tạo Manager
        </Button>
      </Stack>
      {/* First row: Import (left) + Export (right) */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', mb: 2 }}>
        <Box sx={{ flex: '0 0 50%', maxWidth: '49%', height: 180 }}>
          <ImportExport users={users} onImported={fetchUsers} showExport={false} />
        </Box>

        <Box sx={{ flex: '0 0 50%', maxWidth: '49%', p: 3, border: '1px dashed #ccc', borderRadius: 2, bgcolor: 'background.paper', height: 180 }}>
          <Typography variant="h6" mb={1}>Xuất người dùng</Typography>

          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={exportType} onChange={(e) => setExportType(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#49BBBD' }, '& .MuiSvgIcon-root': { color: 'inherit' } }}
                MenuProps={{ PaperProps: { sx: { '& .Mui-selected': { color: '#49BBBD !important', backgroundColor: 'rgba(73,187,189,0.06) !important' } } } }}
              
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={() => handleExportUsers()} sx={{
              backgroundColor: "#49BBBD",
              color: "white",
              "&:hover": {
                backgroundColor: "#3fa6a8",
              },
            }}> 
            Xuất
            </Button>
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Typography variant="body2" color="text.secondary">Xuất nhanh danh sách người dùng hiện tại.</Typography>
        </Box>
      </Box>

      {/* Second row: Search (full width, aligns with table) */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm theo tên đăng nhập / email / tên"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          fullWidth
        />
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="table-header">
                  <TableCell width="10%">Ảnh</TableCell>
                  <TableCell width="25%">Tên đăng nhập</TableCell>
                  <TableCell width="35%">Email</TableCell>
                  <TableCell width="30%" sx={{ pl: "54px" }}>
                    Vai trò
                  </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map((user) => {
                const isSelf = user.username === currentUsername;
                const isAdmin = user.role === "admin";

                return (
                  <TableRow key={user._id} hover sx={{ cursor: 'pointer' }} onClick={() => openUserDetails(user)}>
                    <TableCell>
                      <Avatar
                        src={
                          user.avatar
                            ? `http://localhost:5000${user.avatar}`
                            : ""
                        }
                        sx={{ width: 36, height: 36 }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>

                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>

                    <TableCell>
                      <div className="role-cell-wrapper">
                        <Chip
                          label={roleLabel(user.role)}
                          className={`role-chip role-chip-${user.role}`}
                        />

                        {!isAdmin && !isSelf && (
                          <div className="action-icons">
                            <Tooltip title={user.isLocked ? "Mở khóa" : "Khóa"}>
                              <IconButton
                                size="small"
                                onClick={(ev) => { ev.stopPropagation(); handleToggleBan(user._id); }}
                              >
                                {user.isLocked ? (
                                  <LockIcon color="error" />
                                ) : (
                                  <UnlockIcon color="action" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>
      )}

      {/* User details dialog */}
      <Dialog open={detailOpen} onClose={closeUserDetails} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser?.username}
          <IconButton aria-label="close" onClick={closeUserDetails} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar src={selectedUser.avatar ? `http://localhost:5000${selectedUser.avatar}` : ''} sx={{ width: 64, height: 64 }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Typography variant="h6">{selectedUser.fullName || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
                  <Typography variant="body2">Vai trò: {roleLabel(selectedUser.role)}</Typography>
                </div>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2">Thông tin bổ sung</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selectedUser.bio || '-'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDetails}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ================= CREATE MANAGER MODAL ================= */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            Tạo tài khoản Manager
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              required
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
              fullWidth
            />

            <TextField
              label="Họ và tên (tuỳ chọn)"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
              fullWidth
            />

            <TextField
              label="Nhập lại mật khẩu"
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
              fullWidth
            />

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setOpen(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleCreateManager}>
                Tạo
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Container>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmOptions.title}
        description={confirmOptions.description}
        onConfirm={() => { if (confirmOptions.onConfirm) confirmOptions.onConfirm(); }}
        onClose={() => setConfirmOpen(false)}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </>
  );
}
