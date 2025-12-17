import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Divider, Tabs, Tab, Container, Button,
  CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText,
  IconButton, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Badge, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { Close as CloseIcon, LockOutlined, Edit as EditIcon } from "@mui/icons-material";

// Import API (Giữ nguyên đường dẫn của bạn)
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

  // === CALCULATED VARIABLES (LOGIC QUYỀN HẠN) ===
  
  // 1. Kiểm tra xem người dùng hiện tại có đang nằm trong danh sách thành viên không
  // (Dùng để chặn trường hợp đã rời nhóm nhưng vẫn hiện nút sửa)
  const currentUserInEvent = eventData?.volunteers?.find(v => (v._id || v) === currentUserId);

  // 2. Kiểm tra có phải người tạo gốc không
  const currentUserIsCreator = eventData?.createdBy?._id === currentUserId || eventData?.createdBy === currentUserId;

  // 3. Biến isOwner (Thay thế isManager cũ)
  // Ý nghĩa: Là người có quyền quản trị (Sửa, Duyệt, Xóa tv).
  // Điều kiện: PHẢI đang ở trong nhóm (currentUserInEvent) VÀ (Là Creator HOẶC có role là 'manager')
  const isOwner = currentUserInEvent && (currentUserIsCreator || currentUserInEvent.role === 'manager');

  // === 1. FETCH EVENT DATA ===
  useEffect(() => {
    if (slug && slug !== "undefined") {
      (async () => {
        try {
          const data = await getEventBySlug({ slug, userId: currentUserId });
          setEventData(data);

          if (data.volunteers) {
            // Check xem đã tham gia chưa
            const joined = data.volunteers.some(v => (v._id ? v._id.toString() : v.toString()) === currentUserId);
            setIsJoined(joined);
            
            if (joined) {
                setRequestStatus('joined');
            } else {
                // Check trạng thái request
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

            // Nếu là Admin (isOwner logic tại thời điểm fetch) -> Lấy Requests
            // Ta tính lại logic này cục bộ vì state isOwner chưa cập nhật ngay trong useEffect này
            const userIsAdminLocal = joined && (
                (data.createdBy?._id || data.createdBy) === currentUserId || 
                data.volunteers.some(v => (v._id === currentUserId || v === currentUserId) && v.role === 'manager')
            );
            
            if (userIsAdminLocal && data.requests && Array.isArray(data.requests)) {
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

  // === 3. FETCH REQUESTS (Chỉ Owner) ===
  useEffect(() => {
    // Sử dụng biến isOwner đã đổi tên
    if (eventData?.slug && isOwner && currentTab === 3) {
      (async () => {
        try {
          const data = await getPendingRequests(eventData.slug);
          setPendingRequests(data);
        } catch (error) { }
      })();
    }
  }, [eventData, currentTab, isOwner]);

  // === HANDLERS ===
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
      if (!currentUserUsername) return alert("Vui lòng đăng nhập lại.");
      
      // Check quyền Owner
      if (!isOwner) return alert("Bạn không có quyền chỉnh sửa.");

      // XỬ LÝ CÂU HỎI MẶC ĐỊNH
      let questionToSend = editForm.question;
      // Nếu là Private và để trống câu hỏi -> gán mặc định
      if (editForm.privacy === 'Private' && (!questionToSend || questionToSend.trim() === "")) {
          questionToSend = "Tại sao bạn muốn tham gia sự kiện này?";
      }

      const updatePayload = { 
          ...editForm, 
          question: questionToSend,
          slug: eventData.slug, 
          username: currentUserUsername 
      };

      const updated = await updateEvent(updatePayload);
      
      // Merge dữ liệu để không mất thông tin populate
      setEventData(prev => ({
        ...updated,
        createdBy: prev.createdBy,
        volunteers: prev.volunteers,
        requests: prev.requests 
      }));

      setOpenEditModal(false);
      alert("Cập nhật thành công!");
      window.location.reload();
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
      setJoinAnswer("");
    } catch (error) {
       if (error.message.includes("pending") || error.message.includes("đã gửi yêu cầu")) {
           setRequestStatus('pending');
       }
       alert(error.message);
    }
  };

  const handleLeaveEvent = async () => {
    // TRƯỜNG HỢP ĐẶC BIỆT: Owner rời nhóm Private
    if (isOwner && eventData.privacy === 'Private') {
      const confirmSpecial = window.confirm(
        "CẢNH BÁO: Bạn đang là Quản trị viên của nhóm Riêng tư.\n" +
        "Nếu bạn rời đi, nhóm sẽ tự động chuyển thành Công khai.\n" +
        "Bạn có chắc chắn muốn thực hiện?"
      );
      
      if (!confirmSpecial) return; // Nếu user chọn Cancel thì dừng lại

      // 1. Thực hiện chuyển sang Public trước
      try {
        await updateEvent({
          slug: eventData.slug,
          privacy: 'Public',
          username: currentUserUsername // Cần username để backend check quyền
        });
        
        // Cập nhật state tạm để giao diện phản hồi ngay
        setEventData(prev => ({ ...prev, privacy: 'Public' }));
      } catch (err) {
        console.error("Lỗi khi chuyển sang Public:", err);
        alert("Có lỗi khi chuyển trạng thái nhóm. Vui lòng thử lại.");
        return; // Dừng lại nếu không chuyển được Public
      }
    } 
    // TRƯỜNG HỢP BÌNH THƯỜNG
    else {
      if (!window.confirm("Bạn chắc chắn muốn rời sự kiện này?")) return;
    }

    // 2. Thực hiện rời nhóm (Chung cho cả 2 trường hợp)
    try { 
      await leaveEvent({ slug: eventData.slug, userId: currentUserId }); 
      
      setIsJoined(false); 
      setRequestStatus(null);
      
      alert("Đã rời sự kiện thành công.");
      
      // Reload trang để cập nhật lại toàn bộ quyền hạn và giao diện
      window.location.reload();
    } catch(e) { 
      alert("Lỗi khi rời nhóm: " + e.message); 
    }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
        if (!isOwner) return alert("Không có quyền duyệt thành viên.");

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
           if (!isOwner) return alert("Không có quyền xóa thành viên.");
           await removeMember({ slug: eventData.slug, memberId, managerId: currentUserId }); 
           setEventData(p => ({...p, volunteers: p.volunteers.filter(v => (v._id || v) !== memberId)})); 
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
            {/* Chỉ hiển thị tab yêu cầu với Owner */}
            {isOwner && (
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
                {/* Chỉ Owner mới thấy nút chỉnh sửa */}
                {isOwner && (
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
                <Typography><b>Người tạo:</b> {eventData.createdBy?.username || "Không xác định"}</Typography>
                
                {isOwner && eventData.privacy === 'Private' && eventData.question && (
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
                        const memberId = member._id || member;
                        const role = member.role ? member.role.toLowerCase() : 'volunteer'; 
                        const memberIsCreator = memberId === (eventData.createdBy?._id || eventData.createdBy);
                        const isAdmin = role === 'admin';
                        const isManagerRole = role === 'manager';
                        const isVolunteer = role === 'volunteer';

                        return (
                            <ListItem 
                                key={memberId}
                                secondaryAction={
                                    // Chỉ Owner mới được xóa thành viên, và không được xóa chính mình
                                    isOwner && memberId !== currentUserId && (
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleKickMember(memberId)}>
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
                                            {memberIsCreator && <Chip label="Người tổ chức" size="small" variant="outlined" sx={{ color: '#9c27b0', borderColor: '#9c27b0', height: 20, fontSize: '0.7rem' }} />}
                                            {isManagerRole && <Chip label="Quản lý" size="small" variant="outlined" sx={{ color: '#49BBBD', borderColor: '#49BBBD', height: 20, fontSize: '0.7rem' }} />}
                                            {isAdmin && (
                                                <Chip label="Admin" size="small" variant="outlined" sx={{ color: '#d32f2f', borderColor: '#d32f2f', height: 20, fontSize: '0.7rem' }} />
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

        {/* TAB 3: REQUESTS (CHỈ OWNER) */}
        {currentTab === 3 && isOwner && (
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

      {/* MODAL JOIN */}
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
              <TextField 
                label="Câu hỏi tham gia" 
                fullWidth 
                value={editForm.question} 
                placeholder="Tại sao bạn muốn tham gia sự kiện này?"
                onChange={(e) => setEditForm({...editForm, question: e.target.value})} 
              />
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