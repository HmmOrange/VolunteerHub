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
      <Typography variant="h4" className="user-list-title" align="center">
        Danh sách người dùng
      </Typography>
      
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead className="table-header">
            <TableRow>
                {/* Giữ nguyên widths đã được căn chỉnh */}
                <TableCell sx={{ width: '25%' }}>Username</TableCell>
                <TableCell sx={{ width: '40%' }}>Email</TableCell>
                <TableCell sx={{ width: '35%', paddingLeft: '54px' }}>Vai trò</TableCell> 
            </TableRow>
        </TableHead>
            <TableBody>
              {users.map((user) => {
                const isMySelf = user.username === localStorage.getItem("username"); // Không sửa chính mình
                const isAdmin = user.role === 'admin';

                return (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    
                    {/* CỘT ROLE + ACTIONS */}
                    <TableCell>
                      <div className="role-cell-wrapper">
                        {/* 1. Label Role (Độ dài cố định) */}
                        <Chip 
                          label={getRoleLabel(user.role)} 
                          className={`role-chip ${getRoleClass(user.role)}`}
                        />

                        {/* 2. Các nút điều khiển (Chỉ hiện nếu không phải Admin và không phải chính mình) */}
                        {!isAdmin && !isMySelf && (
                          <div className="action-icons">
                            
                            {/* Nút Mũi tên (Promote/Demote) */}
                            {user.role === 'volunteer' && (
                              <Tooltip title="Thăng cấp lên Quản lý">
                                <IconButton 
                                  size="small" 
                                  className="arrow-btn"
                                  onClick={() => handleRoleChange(user._id, user.role)}
                                >
                                  <UpIcon color="success" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {user.role === 'manager' && (
                              <Tooltip title="Giáng cấp xuống Thành viên">
                                <IconButton 
                                  size="small" 
                                  className="arrow-btn"
                                  onClick={() => handleRoleChange(user._id, user.role)}
                                >
                                  <DownIcon color="warning" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Nút Khóa (Lock/Unlock) */}
                            <Tooltip title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}>
                              <IconButton 
                                size="small" 
                                className="lock-btn"
                                onClick={() => handleToggleBan(user._id)}
                              >
                                {user.isLocked ? (
                                  <LockIcon sx={{ color: 'black' }} /> 
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
    </Container>
  );
}