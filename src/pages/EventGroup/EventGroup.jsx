import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Divider, Tabs, Tab, Container, Button,
  CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText,
  IconButton, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Badge, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { Close as CloseIcon, LockOutlined, Edit as EditIcon, ErrorOutline } from "@mui/icons-material"; // <--- 1. Import thêm icon ErrorOutline

// Import API
import {
  getEventBySlug, joinEvent, leaveEvent, removeMember,
  getPendingRequests, respondToJoinRequest, updateEvent
} from "../../api/Events";
import { getPostsByEvent } from "../../api/Posts";

import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";

import "./EventGroup.css";

export default function EventGroup() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const currentUserId = localStorage.getItem("userId");
  const currentUserUsername = localStorage.getItem("username"); 

  // === STATE ===
  const [eventData, setEventData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); 
  
  const [openJoinModal, setOpenJoinModal] = useState(false);
  const [joinAnswer, setJoinAnswer] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", description: "", location: "", date: "",
    privacy: "Public", question: ""
  });

  // 2. THÊM STATE ĐỂ LƯU LỖI (NẾU BỊ CHẶN)
  const [errorState, setErrorState] = useState(null); 
  // ==========================================

  // === LOGIC PHÂN QUYỀN ===
  const currentUserInEvent = eventData?.volunteers?.find(v => (v._id || v) === currentUserId);
  const currentUserIsCreator = eventData?.createdBy?._id === currentUserId || eventData?.createdBy === currentUserId;
  
  const isOwner = currentUserInEvent && currentUserIsCreator && currentUserInEvent.role === 'manager';

  // === 1. HÀM XỬ LÝ AVATAR ===
  const getAvatarUrl = (user) => {
    if (!user || !user.avatar) return undefined;
    if (user.avatar.startsWith("http")) return user.avatar;
    const path = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `http://localhost:5000${path}`;
  };

  const getAvatarColor = (userRole) => {
    switch (userRole?.toLowerCase()) {
      case 'manager': return '#49BBBD'; 
      case 'admin': return '#d32f2f'; 
      case 'volunteer': return '#9e9e9e'; 
      default: return '#9c27b0'; 
    }
  };

  const renderAvatarProps = (user) => {
    if (user?.avatar) {
      return { src: getAvatarUrl(user), children: null, sx: { bgcolor: 'transparent' } };
    }
    return {
      src: undefined,
      children: user?.username?.charAt(0).toUpperCase() || 'U',
      sx: { bgcolor: getAvatarColor(user?.role) }
    };
  };

  // === FETCH DATA ===
  useEffect(() => {
    if (slug && slug !== "undefined") {
      (async () => {
        try {
          const data = await getEventBySlug({ slug, userId: currentUserId });
          setEventData(data);
          setErrorState(null); // Reset lỗi nếu thành công

          if (data.volunteers) {
            const joined = data.volunteers.some(v => (v._id ? v._id.toString() : v.toString()) === currentUserId);
            setIsJoined(joined);
            
            if (joined) {
                setRequestStatus('joined');
            } else {
                if (data.requestStatus) {
                    setRequestStatus(data.requestStatus);
                } else if (data.requests && Array.isArray(data.requests)) {
                    const isPending = data.requests.some(req => 
                        (req.user?._id === currentUserId) || (req.user === currentUserId)
                    );
                    setRequestStatus(isPending ? 'pending' : null);
                }
            }

            const userIsAdminLocal = joined && (
                (data.createdBy?._id || data.createdBy) === currentUserId || 
                data.volunteers.some(v => (v._id === currentUserId || v === currentUserId) && v.role === 'manager')
            );
            
            if (userIsAdminLocal && data.requests) {
                setPendingRequests(data.requests);
            }
          }
        } catch (error) {
          let msg = "";
            
            // Bây giờ error.response sẽ tồn tại nhờ Bước 1
            if (error.response?.status === 403) {
                msg = "Đã có lỗi xảy ra khi tải sự kiện.";
            } else {
                msg = "Sự kiện chưa được duyệt hoặc đã bị từ chối.";
            }
            
            setErrorState(msg);
        }
      })();
    }
  }, [slug, currentUserId]);

  useEffect(() => {
    if (currentTab === 0 && eventData?._id) {
      const canViewPosts = (eventData.privacy === 'Public') || isJoined;
      if (!canViewPosts) {
          setPosts([]);
          setIsLoadingPosts(false);
          return;
      }
      setIsLoadingPosts(true);
      (async () => {
        try {
          const data = await getPostsByEvent(eventData._id);
          setPosts(data);
        } catch (error) { setPosts([]); }
        setIsLoadingPosts(false);
      })();
    }
  }, [eventData, currentTab, isJoined]);

  useEffect(() => {
    if (eventData?.slug && isOwner && currentTab === 3) {
      (async () => {
        try {
          const data = await getPendingRequests(eventData.slug);
          setPendingRequests(data);
        } catch (error) { }
      })();
    }
  }, [eventData, currentTab, isOwner]);

  // === HANDLERS (Giữ nguyên không đổi) ===
  const handleEditClick = () => {
    setEditForm({
      name: eventData.name,
      description: eventData.description,
      location: eventData.location,
      date: new Date(eventData.date).toISOString().split('T')[0],
      privacy: eventData.privacy || "Public",
      question: eventData.question || "Tại sao bạn muốn tham gia sự kiện này?"
    });
    setOpenEditModal(true);
  };

  const handleUpdateEvent = async () => {
    try {
      if (!isOwner) return alert("Bạn không có quyền chỉnh sửa.");
      let questionToSend = editForm.question;
      if (editForm.privacy === 'Private' && (!questionToSend || questionToSend.trim() === "")) {
          questionToSend = "Tại sao bạn muốn tham gia sự kiện này?";
      }
      const updated = await updateEvent({ ...editForm, question: questionToSend, slug: eventData.slug, username: currentUserUsername });
      setEventData(prev => ({ ...updated, createdBy: prev.createdBy, volunteers: prev.volunteers, requests: prev.requests }));
      setOpenEditModal(false);
      alert("Cập nhật thành công!");
      window.location.reload();
    } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleJoinClick = () => {
    if (!currentUserId) return alert("Bạn cần đăng nhập.");
    if (eventData.privacy === 'Private') setOpenJoinModal(true);
    else callJoinAPI("");
  };

  const callJoinAPI = async (answer) => {
    if (eventData.privacy === 'Private' && eventData.question && !answer.trim()) return alert("Vui lòng trả lời câu hỏi");
    try {
      const res = await joinEvent({ slug: eventData.slug, userId: currentUserId, answer });
      if (res.status === 'pending') {
        alert(res.message);
        setRequestStatus('pending');
      } else {
        alert("Tham gia thành công!");
        setIsJoined(true);
        setRequestStatus('joined');
        window.location.reload();
      }
      setOpenJoinModal(false);
    } catch (error) { alert(error.message); }
  };

  const handleLeaveEvent = async () => {
    if (isOwner && eventData.privacy === 'Private') {
      if (!window.confirm(
        "CẢNH BÁO: Bạn đang là Quản trị viên của nhóm Riêng tư.\n" +
        "Nếu bạn rời đi, nhóm sẽ tự động chuyển thành Công khai.\n" +
        "Bạn có chắc chắn muốn thực hiện?"
      )) return;
      try {
        await updateEvent({ slug: eventData.slug, privacy: 'Public', username: currentUserUsername });
      } catch (err) { return alert("Lỗi chuyển đổi trạng thái nhóm."); }
    } else {
      if (!window.confirm("Bạn chắc chắn muốn rời sự kiện này?")) return;
    }

    try { 
      await leaveEvent({ slug: eventData.slug, userId: currentUserId }); 
      alert("Đã rời sự kiện.");
      window.location.reload();
    } catch(e) { alert(e.message); }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
        await respondToJoinRequest({ requestId, action, managerId: currentUserId });
        setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        if (action === 'approve') { 
            const d = await getEventBySlug({ slug, userId: currentUserId }); 
            setEventData(d); 
        }
    } catch (error) { alert(error.message); }
  };

  const handleKickMember = async (memberId) => {
    if(window.confirm("Mời thành viên này ra khỏi nhóm?")) {
        try { 
            await removeMember({ slug: eventData.slug, memberId, managerId: currentUserId }); 
            setEventData(p => ({...p, volunteers: p.volunteers.filter(v => (v._id || v) !== memberId)})); 
        } catch(e){ alert(e.message) }
    }
  };

  // 4. KIỂM TRA LỖI VÀ RENDER MÀN HÌNH CHẶN (THÊM ĐOẠN NÀY TRƯỚC LOADING)
  if (errorState) {
    return (
      // Giữ nguyên layout nền xám để đồng bộ với App
      <Container maxWidth="lg" sx={{ p: 3, minHeight: '100vh', bgcolor: '#f1f4f7' }}>
          <Paper 
              elevation={0} 
              sx={{ 
                  p: 5, 
                  mt: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  borderRadius: 2
              }}
          >
              <ErrorOutline sx={{ fontSize: 80, color: '#ff6b6b', mb: 2 }} /> {/* Icon màu đỏ nhạt cho đẹp */}
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Truy cập bị từ chối
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
                  {errorState} 
                  {/* Ở đây giờ sẽ hiện tiếng Việt mượt mà do Bước 1 */}
              </Typography>

              <Button 
                  variant="contained" 
                  onClick={() => navigate('/dashboard')}
                  sx={{ 
                      bgcolor: '#49BBBD', 
                      px: 4, 
                      py: 1,
                      '&:hover': { bgcolor: '#3daeb0' }
                  }}
              >
                  Về trang chủ
              </Button>
          </Paper>
      </Container>
    );
  }
  // =========================================================================

  if (!eventData) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#49BBBD' }} /></Container>;

  return (
    // ... (Phần render giao diện chính GIỮ NGUYÊN không thay đổi gì cả)
    <Container maxWidth="lg" sx={{ p: 3, minHeight: '100vh', bgcolor: '#f1f4f7' }}>
      {/* HEADER TABS */}
      <Paper className="event-group-tabs-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ flexGrow: 1, '& .Mui-selected': { color: '#49BBBD !important' }, '& .MuiTabs-indicator': { backgroundColor: '#49BBBD' } }}>
            <Tab label="Bài đăng" />
            <Tab label="Thông tin" />
            <Tab label="Thành viên" />
            {isOwner && (
              <Tab label={<Badge badgeContent={pendingRequests.length} color="error">Yêu cầu tham gia</Badge>} />
            )}
          </Tabs>

          {!isJoined ? (
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleJoinClick} 
              // Chỉ disable khi đang chờ duyệt, 'rejected' hoặc null đều bấm được
              disabled={requestStatus === 'pending'} 
              sx={{ ml: 2, bgcolor: '#49BBBD' }}
            >
              {/* Logic hiển thị chữ trên nút */}
              {requestStatus === 'pending' 
                ? "Đang chờ duyệt" 
                : "Tham gia"
              }
            </Button>
          ) : (
            <Button variant="outlined" color="inherit" size="small" onClick={handleLeaveEvent} sx={{ ml: 2, color: 'gray', borderColor: 'gray' }}>
              Rời khỏi
            </Button>
          )}
        </Box>
      </Paper>

      <Box className="event-group-content-area">
        {/* TAB 0: POSTS */}
        {currentTab === 0 && (
          (eventData.privacy === 'Private' && !isJoined) ? (
            <Paper sx={{ py: 8, mt: 2, textAlign: 'center' }} variant="outlined">
              <LockOutlined sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Nhóm riêng tư</Typography>
              <Typography variant="body2" color="text.secondary">Bạn cần tham gia sự kiện để xem bài đăng</Typography>
              {requestStatus !== 'pending' && <Button variant="contained" onClick={handleJoinClick} sx={{ mt: 2, bgcolor: '#49BBBD' }}>Tham gia ngay</Button>}
            </Paper>
          ) : (
            <>
              {isJoined && <CreatePost eventId={eventData._id} onPostCreated={(p) => setPosts([p, ...posts])} />}
              {isLoadingPosts ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress sx={{ color: '#49BBBD' }}/></Box> : 
               posts.length === 0 ? <Typography textAlign="center" sx={{ mt: 2 }}>Chưa có bài đăng nào.</Typography> :
               posts.map(post => <PostCard key={post._id} post={post} eventOwnerId={eventData.createdBy?._id || eventData.createdBy} onPostDeleted={(id) => setPosts(posts.filter(p => p._id !== id))} onPostUpdated={(updated) => setPosts(posts.map(p => p._id === updated._id ? updated : p))} />)
              }
            </>
          )
        )}

        {/* TAB 1: THÔNG TIN */}
        {currentTab === 1 && (
          <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Thông tin sự kiện</Typography>
                {isOwner && (
                  <Button startIcon={<EditIcon />} variant="contained" size="small" onClick={handleEditClick} sx={{ bgcolor: '#49BBBD' }}>
                      Chỉnh sửa
                  </Button>
                )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{eventData.description}</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
                <Typography><b>Địa điểm:</b> {eventData.location}</Typography>
                <Typography><b>Ngày tổ chức:</b> {new Date(eventData.date).toLocaleDateString('vi-VN')}</Typography>
                <Typography><b>Quyền riêng tư:</b> {eventData.privacy === 'Private' ? 'Riêng tư' : 'Công khai'}</Typography>
                <Typography><b>Người tạo:</b> {eventData.createdBy?.username || "Không xác định"}</Typography>
                {isOwner && eventData.privacy === 'Private' && eventData.question && (
                    <Typography sx={{ mt: 1 }}><b>Câu hỏi tham gia:</b> {eventData.question}</Typography>
                )}
            </Stack>
          </Paper>
        )}

        {/* TAB 2: THÀNH VIÊN */}
        {currentTab === 2 && (
          <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
            <Typography variant="h6">Thành viên ({eventData?.volunteers?.length || 0})</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
                {eventData.volunteers?.map((member) => {
                    const memberId = member._id || member;
                    const role = member.role?.toLowerCase() || 'volunteer';
                    const memberIsCreator = memberId === (eventData.createdBy?._id || eventData.createdBy);
                    
                    const avatarProps = renderAvatarProps(member);

                    return (
                        <ListItem key={memberId} secondaryAction={
                            isOwner && memberId !== currentUserId && (
                                <IconButton onClick={() => handleKickMember(memberId)}><CloseIcon fontSize="small" /></IconButton>
                            )
                        }>
                            <ListItemAvatar>
                                <Avatar {...avatarProps} />
                            </ListItemAvatar>
                            <ListItemText 
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography>{member.username}</Typography>
                                    {memberIsCreator && <Chip label="Người tổ chức" size="small" variant="outlined" sx={{ color: '#9c27b0', borderColor: '#9c27b0', height: 20 }} />}
                                    {role === 'manager' && <Chip label="Quản lý" size="small" variant="outlined" sx={{ color: '#49BBBD', borderColor: '#49BBBD', height: 20 }} />}
                                    {role === 'volunteer' && (
                                      <Chip label="Tình nguyện viên" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: '#e0e0e0', height: 20, fontSize: '0.7rem' }} />
                                    )}
                                    {role === 'admin' && (
                                      <Chip label="Admin" size="small" variant="outlined" sx={{ color: '#d32f2f', borderColor: '#d32f2f', height: 20, fontSize: '0.7rem' }} />
                                    )}
                                  </Stack>
                                } 
                                secondary={member.email} 
                            />
                        </ListItem>
                    );
                })}
            </List>
          </Paper>
        )}

        {/* TAB 3: YÊU CẦU THAM GIA */}
        {currentTab === 3 && isOwner && (
          <Paper sx={{ mt: 2 }} variant="outlined">
            <Typography variant="h6" sx={{ p: 2 }}>Yêu cầu ({pendingRequests.length})</Typography>
            <Divider />
            <List>
              {pendingRequests.map(req => (
                <ListItem key={req._id} secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" sx={{ bgcolor: "#49BBBD" }} onClick={() => handleRespondToRequest(req._id, "approve")}>Duyệt</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleRespondToRequest(req._id, 'reject')}>Từ chối</Button>
                  </Stack>
                }>
                   <ListItemAvatar>
                      <Avatar {...renderAvatarProps(req.user)} />
                   </ListItemAvatar>
                   <ListItemText primary={req.user?.username} secondary={req.answer} />
                </ListItem>
              ))}
              {pendingRequests.length === 0 && (
                  <Typography textAlign="center" sx={{p: 2, color: 'text.secondary'}}>Không có yêu cầu nào.</Typography>
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* MODAL JOIN */}
      <Dialog open={openJoinModal} onClose={() => setOpenJoinModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trả lời câu hỏi</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{eventData.question}</Typography>
          <TextField fullWidth multiline rows={3} value={joinAnswer} onChange={(e) => setJoinAnswer(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJoinModal(false)}>Hủy</Button>
          <Button onClick={() => callJoinAPI(joinAnswer)} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Gửi</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL EDIT */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Tên" fullWidth value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            <TextField label="Mô tả" fullWidth multiline rows={4} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
            <TextField label="Địa điểm" fullWidth value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
            <TextField label="Ngày" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
            <FormControl>
              <FormLabel>Quyền riêng tư</FormLabel>
              <RadioGroup row value={editForm.privacy} onChange={(e) => setEditForm({...editForm, privacy: e.target.value})}>
                <FormControlLabel value="Public" control={<Radio />} label="Công khai" />
                <FormControlLabel value="Private" control={<Radio />} label="Riêng tư" />
              </RadioGroup>
            </FormControl>
            {editForm.privacy === 'Private' && (
              <TextField label="Câu hỏi tham gia" fullWidth value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Hủy</Button>
          <Button onClick={handleUpdateEvent} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}