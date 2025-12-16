import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Divider, Tabs, Tab, Container, Button,
  CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText,
  IconButton, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Badge, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { Close as CloseIcon, LockOutlined, Edit as EditIcon } from "@mui/icons-material";

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
  
  const currentUserId = localStorage.getItem("userId");
  const currentUserUsername = localStorage.getItem("username"); 

  // === STATE ===
  const [eventData, setEventData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  
  // Trạng thái user
  const [isJoined, setIsJoined] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); 
  
  // Modal & Form
  const [openJoinModal, setOpenJoinModal] = useState(false);
  const [joinAnswer, setJoinAnswer] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", description: "", location: "", date: "",
    privacy: "Public", question: ""
  });

  // === CALCULATED VARIABLES ===
  // 1. Xác định chính xác Creator
  const currentUserIsCreator = eventData?.createdBy?._id === currentUserId || eventData?.createdBy === currentUserId;

  // 2. Xác định Role (để hiển thị Chip ở Tab Thành viên)
  const currentUserInEvent = eventData?.volunteers?.find(v => (v._id || v) === currentUserId);
  const currentUserRole = currentUserInEvent?.role ? currentUserInEvent.role.toLowerCase() : (currentUserIsCreator ? 'manager' : 'volunteer');

  // === 1. FETCH EVENT DATA ===
  useEffect(() => {
    if (slug && slug !== "undefined") {
      (async () => {
        try {
          const data = await getEventBySlug({ slug, userId: currentUserId });
          setEventData(data);

          if (data.volunteers) {
            const joined = data.volunteers.some(v => (v._id || v) === currentUserId);
            setIsJoined(joined);
            
            // Logic check Request Status
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
                } else {
                    setRequestStatus(null);
                }
            }

            // Chỉ Creator mới lấy danh sách request để hiển thị Badge
            const isCreator = data.createdBy?._id === currentUserId || data.createdBy === currentUserId;
            if (isCreator && data.requests && Array.isArray(data.requests)) {
                setPendingRequests(data.requests);
            }
          }
        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [slug, currentUserId]);

  // === 2. FETCH POSTS ===
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
        } catch (error) {
          setPosts([]);
        }
        setIsLoadingPosts(false);
      })();
    }
  }, [eventData, currentTab, isJoined]);

  // === 3. FETCH REQUESTS (Chỉ Creator) ===
  useEffect(() => {
    // Chỉ chạy nếu là Creator và đang ở Tab 3
    if (eventData?._id && currentUserIsCreator && currentTab === 3) {
      (async () => {
        try {
          const data = await getPendingRequests(eventData._id);
          setPendingRequests(data);
        } catch (error) { }
      })();
    }
  }, [eventData, currentTab, currentUserIsCreator]);

  // === HANDLERS ===
  const handleEditClick = () => {
    setEditForm({
      name: eventData.name,
      description: eventData.description,
      location: eventData.location,
      date: new Date(eventData.date).toISOString().split('T')[0],
      privacy: eventData.privacy || "Public",
      question: eventData.question || ""
    });
    setOpenEditModal(true);
  };

  const handleUpdateEvent = async () => {
    try {
      if (!currentUserUsername) return alert("Vui lòng đăng nhập lại.");
      const updatePayload = { ...editForm, slug: eventData.slug, username: currentUserUsername };
      const updated = await updateEvent(updatePayload);
      setEventData(updated);
      setOpenEditModal(false);
      alert("Cập nhật thành công!");
    } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleJoinClick = () => {
    if (!currentUserId) return alert("Bạn cần đăng nhập.");
    if (eventData.privacy === 'Private') {
      setOpenJoinModal(true);
    } else {
      callJoinAPI("");
    }
  };

  const callJoinAPI = async (answer) => {
    if (eventData.privacy === 'Private' && eventData.question && !answer.trim()) {
        return alert("Vui lòng trả lời câu hỏi");
    }
    try {
      const res = await joinEvent({ eventId: eventData._id, userId: currentUserId, answer });
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
      setJoinAnswer("");
    } catch (error) {
       if (error.message.includes("pending") || error.message.includes("đã gửi yêu cầu")) {
           setRequestStatus('pending');
       }
       alert(error.message);
    }
  };

  const handleLeaveEvent = async () => {
    if(window.confirm("Rời sự kiện?")) {
      try { 
          await leaveEvent({eventId: eventData._id, userId: currentUserId}); 
          setIsJoined(false); 
          setRequestStatus(null);
          window.location.reload();
      } catch(e){ alert(e.message) }
    }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
        await respondToJoinRequest({ requestId, action, managerId: currentUserId });
        setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        if (action === 'approve') { 
             const d = await getEventBySlug({ slug, userId: currentUserId }); 
             setEventData(d); 
        }
    } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleKickMember = async (memberId) => {
    if(window.confirm("Mời thành viên này ra khỏi nhóm?")) {
       try { 
           await removeMember({eventId: eventData._id, memberId, managerId: currentUserId}); 
           setEventData(p => ({...p, volunteers: p.volunteers.filter(v=>v._id!==memberId)})); 
       } catch(e){ alert(e.message) }
    }
  };

  const handleTabChange = (e, v) => setCurrentTab(v);
  const handlePostCreated = (p) => setPosts([p, ...posts]);
  const handlePostDeleted = (id) => setPosts(posts.filter(p => p._id !== id));
  const handlePostUpdated = (u) => setPosts(posts.map(p => p._id === u._id ? u : p));
  const getSortedMembers = () => { return eventData?.volunteers || []; };
  
  const getJoinButtonText = () => { 
      if (isJoined) return "Đã tham gia"; 
      if (requestStatus === 'pending') return "Đang chờ duyệt"; 
      return "Tham gia"; 
  };

  if (!eventData) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#49BBBD' }} /></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      {/* Header Tabs */}
      <Paper className="event-group-tabs-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ flexGrow: 1, '& .Mui-selected': { color: '#49BBBD !important' }, '& .MuiTabs-indicator': { backgroundColor: '#49BBBD' } }}>
            <Tab label="Bài đăng" />
            <Tab label="Thông tin" />
            <Tab label="Thành viên" />
            {/* CHỈ CREATOR MỚI THẤY TAB YÊU CẦU */}
            {currentUserIsCreator && (
              <Tab label={<Badge badgeContent={pendingRequests.length} color="error">Yêu cầu tham gia</Badge>} />
            )}
          </Tabs>

          {!isJoined ? (
            <Button 
                variant="contained" size="small" onClick={handleJoinClick} disabled={requestStatus === 'pending'} 
                sx={{ ml: 2, bgcolor: '#49BBBD', '&:hover': { bgcolor: '#3c9a9a' } }}
            >
              {getJoinButtonText()}
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
              {isJoined && <CreatePost eventId={eventData._id} onPostCreated={handlePostCreated} />}
              {isLoadingPosts ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress sx={{ color: '#49BBBD' }}/></Box> : 
               posts.length === 0 ? <Typography textAlign="center" sx={{ mt: 2 }}>Chưa có bài đăng nào.</Typography> :
               posts.map(post => <PostCard key={post._id} post={post} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />)
              }
            </>
          )
        )}

        {/* TAB 1: THÔNG TIN */}
        {currentTab === 1 && (
          <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Thông tin sự kiện</Typography>
                
                {/* CHỈ CREATOR MỚI THẤY NÚT CHỈNH SỬA */}
                {currentUserIsCreator && (
                <Button startIcon={<EditIcon />} variant="contained" size="small" onClick={handleEditClick} sx={{ bgcolor: '#49BBBD', color: 'white', '&:hover': { bgcolor: '#3da8aa' } }}>
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
                <Typography><b>Người tạo:</b> {eventData.createdBy?.username}</Typography>
                
                {/* CHỈ CREATOR MỚI THẤY CÂU HỎI */}
                {currentUserIsCreator && eventData.privacy === 'Private' && eventData.question && (
                    <Typography sx={{ mt: 1 }}><b>Câu hỏi tham gia:</b> {eventData.question}</Typography>
                )}
            </Stack>
          </Paper>
        )}

        {/* TAB 2: MEMBERS */}
        {currentTab === 2 && (
          <Paper className="temp-post-box" elevation={0} variant="outlined" sx={{mt: 2, p: 2}}>
            <Typography variant="h6" gutterBottom>
                Thành viên ({eventData?.volunteers?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {!eventData?.volunteers?.length ? (
                <Typography fontStyle="italic" color="text.secondary">Chưa có thành viên nào.</Typography>
            ) : (
                <List>
                    {getSortedMembers().map((member) => {
                        const role = member.role ? member.role.toLowerCase() : 'volunteer'; 
                        const isCreator = member._id === eventData.createdBy._id || member._id === eventData.createdBy;
                        const isAdmin = role === 'admin';
                        const isManagerRole = role === 'manager';
                        const isVolunteer = role === 'volunteer';

                        return (
                            <ListItem 
                                key={member._id}
                                secondaryAction={
                                    // Creator xóa mọi người, Manager xóa volunteer. Không ai xóa được Creator.
                                    (currentUserIsCreator || (currentUserRole === 'manager' && !isCreator && !isManagerRole)) && member._id !== currentUserId && (
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleKickMember(member._id)}>
                                            <CloseIcon color="disabled" fontSize="small" />
                                        </IconButton>
                                    )
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: '#49BBBD' }}> 
                                        {member.username?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                
                                <ListItemText 
                                    primary={
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
                                            <Typography variant="body1" sx={{ color: "text.primary" }}>
                                                {member.username}
                                            </Typography>

                                            {isCreator && (
                                                <Chip label="Người tổ chức" size="small" variant="outlined" sx={{ color: '#9c27b0', borderColor: '#9c27b0', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                            {isAdmin && (
                                                <Chip label="Admin" size="small" variant="outlined" sx={{ color: '#d32f2f', borderColor: '#d32f2f', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                            {isManagerRole && (
                                                <Chip label="Quản lý" size="small" variant="outlined" sx={{ color: '#49BBBD', borderColor: '#49BBBD', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                            {isVolunteer && (
                                                <Chip label="Tình nguyện viên" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: '#e0e0e0', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                        </Stack>
                                    }
                                    secondary={member.email} 
                                />
                            </ListItem>
                        );
                    })}
                </List>
            )}
          </Paper>
        )}

        {/* TAB 3: REQUESTS (CHỈ CREATOR) */}
        {currentTab === 3 && currentUserIsCreator && (
          <Paper sx={{ mt: 2 }} variant="outlined">
            <Typography variant="h6" sx={{ p: 2 }}>Yêu cầu tham gia ({pendingRequests.length})</Typography>
            <Divider />
            {!pendingRequests.length ? <Typography sx={{ p: 2 }} color="text.secondary">Không có yêu cầu nào.</Typography> : (
              <List>
                {pendingRequests.map(req => (
                  <ListItem key={req._id} alignItems="flex-start" secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" size="small" sx={{ backgroundColor: "#49BBBD", "&:hover": { backgroundColor: "#3da8aa" } }} onClick={() => handleRespondToRequest(req._id, "approve")}>
                        Xác nhận
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => handleRespondToRequest(req._id, 'reject')}>
                        Từ chối
                      </Button>
                    </Stack>
                  }>
                    <ListItemAvatar><Avatar sx={{ bgcolor: '#49BBBD' }}>{req.user?.username?.charAt(0)}</Avatar></ListItemAvatar>
                    <ListItemText
                      primary={req.user?.username}
                      secondary={
                        <>
                          <Typography variant="body2" display="block">Email: {req.user?.email}</Typography>
                          {req.answer && <Typography variant="body2" color="text.primary"><b>Trả lời:</b> {req.answer}</Typography>}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Box>

      {/* MODAL JOIN - Cập nhật giao diện mới */}
      <Dialog open={openJoinModal} onClose={() => setOpenJoinModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trả lời câu hỏi tham gia</DialogTitle>
        <DialogContent sx={{ pb: 0}}>
          {eventData.question && <Typography sx={{ mb: 2, fontWeight: 'medium' }}>{eventData.question}</Typography>}
          <TextField autoFocus fullWidth multiline rows={3} placeholder="Câu trả lời..." value={joinAnswer} onChange={(e) => setJoinAnswer(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ py: 2.5}}>
          <Button onClick={() => setOpenJoinModal(false)} sx={{ color: '#49BBBD' }}>Hủy</Button>
          <Button onClick={() => callJoinAPI(joinAnswer)} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Gửi yêu cầu</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL EDIT */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Tên sự kiện" fullWidth value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            <TextField label="Mô tả" fullWidth multiline rows={4} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Địa điểm" fullWidth value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
              <TextField label="Ngày tổ chức" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
            </Stack>
            <FormControl>
              <FormLabel>Quyền riêng tư</FormLabel>
              <RadioGroup row value={editForm.privacy} onChange={(e) => setEditForm({...editForm, privacy: e.target.value})}>
                <FormControlLabel value="Public" control={<Radio sx={{color: '#49BBBD', '&.Mui-checked': {color: '#49BBBD'}}} />} label="Công khai" />
                <FormControlLabel value="Private" control={<Radio sx={{color: '#49BBBD', '&.Mui-checked': {color: '#49BBBD'}}} />} label="Riêng tư" />
              </RadioGroup>
            </FormControl>
            {editForm.privacy === 'Private' && (
              <TextField label="Câu hỏi tham gia" fullWidth value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)} sx={{ color: '#49BBBD' }}>Hủy</Button>
          <Button onClick={handleUpdateEvent} variant="contained" sx={{ bgcolor: '#49BBBD', '&:hover': { bgcolor: '#3da8aa' } }}>Lưu thay đổi</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}