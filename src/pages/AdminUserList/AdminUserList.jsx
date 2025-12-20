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
} from "@mui/material";
import {
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import {
  getAllUsers,
  updateUserRole,
  toggleUserLock,
  createManager,
} from "../../api/Users";

import "./UserList.css";

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

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= ACTIONS ================= */

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "volunteer" ? "manager" : "volunteer";
    if (!window.confirm("Xác nhận thay đổi vai trò?")) return;

    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleToggleBan = async (userId) => {
    if (!window.confirm("Xác nhận khóa / mở khóa tài khoản?")) return;

    try {
      const res = await toggleUserLock(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isLocked: res.user.isLocked } : u
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  /* ================= CREATE MANAGER ================= */

  const handleCreateManager = async () => {
    const { username, email, fullName, password, confirmPassword } = form;

    if (!username || !email || !password || !confirmPassword) {
      alert("Username, email và mật khẩu là bắt buộc.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      await createManager({
        username,
        email,
        password,
        fullName,
      });

      alert("Tạo tài khoản Manager thành công.");
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
      alert(err.message);
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

  return (
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
        >
          Tạo Manager
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="table-header">
                <TableCell width="10%">Avatar</TableCell>
                <TableCell width="25%">Username</TableCell>
                <TableCell width="35%">Email</TableCell>
                <TableCell width="30%" sx={{ pl: "54px" }}>
                  Vai trò
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => {
                const isSelf = user.username === currentUsername;
                const isAdmin = user.role === "admin";

                return (
                  <TableRow key={user._id} hover>
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
                            <Tooltip title="Đổi vai trò">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRoleChange(user._id, user.role)
                                }
                              >
                                {user.role === "volunteer" ? (
                                  <UpIcon color="success" />
                                ) : (
                                  <DownIcon color="warning" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip
                              title={user.isLocked ? "Mở khóa" : "Khóa"}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleToggleBan(user._id)}
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
        </TableContainer>
      )}

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
  );
}
