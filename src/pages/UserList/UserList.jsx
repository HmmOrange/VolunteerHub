import { useEffect, useState } from "react";
import { 
  Container, Paper, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress, 
  IconButton, Tooltip,
  Divider
} from "@mui/material";
import { 
  ArrowUpward as UpIcon, 
  ArrowDownward as DownIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon
} from "@mui/icons-material";

import { getAllUsers, updateUserRole, toggleUserLock } from "../../api/Users";
import "./UserList.css"; // Import file CSS

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserRole = localStorage.getItem("role"); 

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      // Giả lập thêm trường isBanned cho frontend (vì DB chưa có)
      const usersWithBanStatus = data.map(u => ({ ...u, isBanned: false }));
      setUsers(usersWithBanStatus);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý thăng/giáng cấp
  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'volunteer' ? 'manager' : 'volunteer';
    const actionName = newRole === 'manager' ? 'thăng cấp lên Quản lý' : 'giáng cấp xuống Thành viên';

    if (window.confirm(`Bạn có chắc muốn ${actionName} cho người dùng này?`)) {
      try {
        await updateUserRole(userId, newRole);
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  // Xử lý Khóa/Mở khóa (Tạm thời chỉ đổi state ở Frontend)
  const handleToggleBan = async (userId) => {
    // Tìm user hiện tại để hiển thị confirm đúng thông điệp
    const userToToggle = users.find(u => u._id === userId);
    const action = userToToggle.isLocked ? "Mở khóa" : "Khóa";

    if (window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) {
      try {
        const res = await toggleUserLock(userId);
        
        // Cập nhật state UI ngay lập tức
        setUsers(users.map(u => 
          u._id === userId ? { ...u, isLocked: res.user.isLocked } : u
        ));
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  if (currentUserRole !== 'admin') {
    return <Typography sx={{ p: 3, color: 'error.main' }}>Bạn không có quyền truy cập trang này.</Typography>;
  }

  // Helper để lấy class CSS theo role
  const getRoleClass = (role) => {
    switch (role) {
      case 'admin': return 'role-chip-admin';
      case 'manager': return 'role-chip-manager';
      default: return 'role-chip-volunteer';
    }
  };

  // Helper để lấy Label hiển thị
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Quản lý';
      default: return 'Thành viên';
    }
  };

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
                const isMySelf = user.username === localStorage.getItem("username"); // Không sửa chính mình
                const isAdmin = user.role === 'admin';

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
                    
                    {/* CỘT ROLE + ACTIONS */}
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