import { useEffect, useState } from "react";
import { 
  Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress, 
  IconButton, Tooltip, Divider, Avatar
} from "@mui/material";
import { 
  ArrowUpward as UpIcon, 
  ArrowDownward as DownIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon
} from "@mui/icons-material";

import { getAllUsers, updateUserRole, toggleUserLock } from "../../api/Users";
import "./UserList.css";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserRole = localStorage.getItem("role");

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

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "volunteer" ? "manager" : "volunteer";
    if (!window.confirm("Xác nhận thay đổi vai trò?")) return;

    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleToggleBan = async (userId) => {
    if (!window.confirm("Xác nhận khóa / mở khóa tài khoản?")) return;

    try {
      const res = await toggleUserLock(userId);
      setUsers(users.map(u =>
        u._id === userId ? { ...u, isLocked: res.user.isLocked } : u
      ));
    } catch (error) {
      alert(error.message);
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
    role === "admin" ? "Admin" : role === "manager" ? "Quản lý" : "Thành viên";

  return (
    <Container maxWidth="md" className="user-list-container">
      <Divider sx={{ mb: 3 }} />
      {/* 1. Thêm class user-list-title */}
      <Typography variant="h4" className="user-list-title">
        Danh sách người dùng
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              {/* 2. Thêm class table-header */}
              <TableRow className="table-header">
                <TableCell sx={{ width: "10%" }}>Avatar</TableCell>
                <TableCell sx={{ width: "25%" }}>Username</TableCell>
                <TableCell sx={{ width: "35%" }}>Email</TableCell>
                <TableCell sx={{ width: "30%", paddingLeft: '54px'  }}>Vai trò</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => {
                const isSelf = user.username === localStorage.getItem("username");
                const isAdmin = user.role === "admin";

                return (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Avatar
                        src={user.avatar ? `http://localhost:5000${user.avatar}` : ""}
                        sx={{ width: 36, height: 36 }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>

                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>

                    <TableCell>
                      {/* 3. Thêm wrapper role-cell-wrapper để căn chỉnh flex */}
                      <div className="role-cell-wrapper">
                        
                        {/* 4. Thêm class role-chip và class màu động theo role */}
                        <Chip 
                          label={roleLabel(user.role)} 
                          className={`role-chip role-chip-${user.role}`}
                        />

                        {!isAdmin && !isSelf && (
                          // 5. Thêm wrapper action-icons cho các nút
                          <div className="action-icons">
                            <Tooltip title="Đổi vai trò">
                              <IconButton
                                size="small"
                                className="arrow-btn" // 6. Thêm class cho nút
                                onClick={() => handleRoleChange(user._id, user.role)}
                              >
                                {user.role === "volunteer" ? (
                                  <UpIcon color="success" />
                                ) : (
                                  <DownIcon color="warning" />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={user.isLocked ? "Mở khóa" : "Khóa"}>
                              <IconButton
                                size="small"
                                className="lock-btn" // 7. Thêm class cho nút
                                onClick={() => handleToggleBan(user._id)}
                              >
                                {user.isLocked ? <LockIcon color="error" /> : <UnlockIcon color="action" />}
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
    </Container>
  );
}