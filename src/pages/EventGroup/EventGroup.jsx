import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Tabs,
  Tab,
  Container, 
  Button, 
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Chip,
  Stack 
} from "@mui/material";
import { Close as CloseIcon, LockOutlined } from "@mui/icons-material"; // Thêm icon Lock

// Import API
import { getEventBySlug, joinEvent, leaveEvent, removeMember } from "../../api/Events"; 
import { getPostsByEvent } from "../../api/Posts"; 

// Import components
import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";

import "./EventGroup.css"; 

export default function EventGroup() {
  const { slug } = useParams(); 
  const currentUserId = localStorage.getItem("userId"); 

  const [eventData, setEventData] = useState(null); 
  const [posts, setPosts] = useState([]); 
  const [currentTab, setCurrentTab] = useState(0); 
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  // 1. Tải thông tin sự kiện
  useEffect(() => {
    if (slug && slug !== "undefined") {
      (async () => {
        try {
          const data = await getEventBySlug({ slug }); 
          setEventData(data);
          
          if (data.volunteers) {
             const joined = data.volunteers.some(v => v._id === currentUserId);
             setIsJoined(joined);
          }

        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [slug, currentUserId]); 

  // 2. Tải bài đăng
  useEffect(() => {
    // Chỉ tải nếu đang ở Tab 0 VÀ Đã có dữ liệu sự kiện VÀ (Quan trọng) Đã tham gia
    // Tuy nhiên, để tránh lỗi logic khi user vừa join xong, ta cứ tải, nhưng chặn hiển thị ở dưới
    if (currentTab === 0 && eventData?._id) { 
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
  }, [eventData, currentTab]); 

  // === XỬ LÝ THAM GIA / RỜI KHỎI ===
  const handleJoinToggle = async () => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để tham gia sự kiện");
      return;
    }

    try {
      if (isJoined) {
        if (window.confirm("Bạn có chắc muốn rời khỏi sự kiện này?")) {
          await leaveEvent({ eventId: eventData._id, userId: currentUserId });
          setIsJoined(false);
          setEventData(prev => ({
            ...prev,
            volunteers: prev.volunteers.filter(v => v._id !== currentUserId)
          }));
        }
      } else {
        await joinEvent({ eventId: eventData._id, userId: currentUserId });
        setIsJoined(true);
        window.location.reload(); 
      }
    } catch (error) {
      alert("Có lỗi xảy ra: " + error.message);
    }
  };

  // === MANAGER XÓA THÀNH VIÊN ===
  const handleKickMember = async (memberId) => {
    if (window.confirm("Bạn muốn mời thành viên này ra khỏi sự kiện?")) {
      try {
        await removeMember({ 
            eventId: eventData._id, 
            memberId: memberId, 
            managerId: currentUserId 
        });
        setEventData(prev => ({
            ...prev,
            volunteers: prev.volunteers.filter(v => v._id !== memberId)
        }));
      } catch (error) {
        alert("Không thể xóa thành viên: " + error.message);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]); 
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(posts.filter(post => post._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  // === QUYỀN XÓA THÀNH VIÊN ===
  const currentUserIsCreator = eventData?.createdBy?._id === currentUserId;

  // === HÀM SẮP XẾP THÀNH VIÊN ===
  const getSortedMembers = () => {
    if (!eventData || !eventData.volunteers) return [];
    const creatorId = eventData.createdBy._id;
    return [...eventData.volunteers].sort((a, b) => {
      if (a._id === creatorId) return -1;
      if (b._id === creatorId) return 1;
      const aIsAdmin = a.role === 'admin';
      const bIsAdmin = b.role === 'admin';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      const aIsManager = a.role === 'manager';
      const bIsManager = b.role === 'manager';
      if (aIsManager && !bIsManager) return -1;
      if (!aIsManager && bIsManager) return 1;
      return a.username.localeCompare(b.username);
    });
  };

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      
      {/* Thanh Tabs & Header */}
      <Paper className="event-group-tabs-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 0 16px' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ flexGrow: 1, '& .Mui-selected': { color: '#49BBBD !important' }, '& .MuiTabs-indicator': { backgroundColor: '#49BBBD' } }}
          >
            <Tab label="Bài đăng" />
            <Tab label="Thông tin" />
            <Tab label="Thành viên" /> 
          </Tabs>

          <Button
            variant={isJoined ? "outlined" : "contained"}
            color={isJoined ? "inherit" : "primary"}
            size="small"
            onClick={handleJoinToggle}
            sx={{
              ml: 2, 
              backgroundColor: isJoined ? 'transparent' : '#49BBBD',
              color: isJoined ? 'gray' : 'white',
              '&:hover': { backgroundColor: isJoined ? '#f0f0f0' : '#3c9a9a' },
              whiteSpace: 'nowrap'
            }}
          >
            {isJoined ? "Đã tham gia" : "Tham gia"}
          </Button>
        </Box>
      </Paper>

      <Box className="event-group-content-area">
        
        {/* Tab 0: Bài đăng */}
        {currentTab === 0 && (
          <>
            {/* === KIỂM TRA ĐIỀU KIỆN: CHƯA THAM GIA === */}
            {!isJoined ? (
               <Paper 
                 className="temp-post-box" 
                 elevation={0} 
                 variant="outlined" 
                 sx={{ 
                   display: 'flex', 
                   flexDirection: 'column', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   py: 8,
                   mt: 2
                 }}
               >
                 <LockOutlined sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                 <Typography variant="h6" color="text.secondary">
                   Bạn cần tham gia sự kiện để xem các bài đăng
                 </Typography>
                 <Button 
                   variant="contained" 
                   onClick={handleJoinToggle}
                   sx={{ mt: 2, bgcolor: '#49BBBD', '&:hover': { bgcolor: '#3c9a9a' } }}
                 >
                   Tham gia ngay
                 </Button>
               </Paper>
            ) : (
              /* === NẾU ĐÃ THAM GIA: HIỆN NỘI DUNG BÀI ĐĂNG === */
              <>
                <CreatePost eventId={eventData?._id} onPostCreated={handlePostCreated} />
                {isLoadingPosts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : posts.length === 0 ? (
                  <Typography textAlign="center">Chưa có bài đăng nào.</Typography>
                ) : (
                  posts.map((post) => (
                    <PostCard 
                        key={post._id} 
                        post={post} 
                        onPostDeleted={handlePostDeleted}
                        onPostUpdated={handlePostUpdated}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}

        {/* Tab 1: Thông tin (Hiển thị công khai) */}
        {currentTab === 1 && (
          <Paper className="temp-post-box info-tab" elevation={0} variant="outlined">
            {!eventData ? <CircularProgress /> : (
              <>
                <Typography variant="h6" gutterBottom>Thông tin sự kiện</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{eventData.description}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1"><b>Địa điểm:</b> {eventData.location}</Typography>
                <Typography variant="body1"><b>Thời gian:</b> {new Date(eventData.date).toLocaleString('vi-VN')}</Typography>
                <Typography variant="body1"><b>Người tạo:</b> {eventData.createdBy?.username || 'Không rõ'}</Typography>
              </>
            )}
          </Paper>
        )}

        {/* Tab 2: Thành viên (Hiển thị công khai) */}
        {currentTab === 2 && (
          <Paper className="temp-post-box" elevation={0} variant="outlined">
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
                        const isCreator = member._id === eventData.createdBy._id;
                        const isAdmin = role === 'admin';
                        const isManager = role === 'manager';
                        const isVolunteer = role === 'volunteer';

                        return (
                            <ListItem 
                                key={member._id}
                                secondaryAction={
                                    currentUserIsCreator && member._id !== currentUserId && (
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

                                            {isAdmin && (
                                                <Chip label="Admin" size="small" variant="outlined" sx={{ color: '#d32f2f', borderColor: '#d32f2f', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                            {isCreator && isManager && (
                                                <Chip label="Quản lý" size="small" variant="outlined" sx={{ color: '#49BBBD', borderColor: '#49BBBD', height: 20, fontSize: '0.7rem' }} />
                                            )}
                                            {isVolunteer || (!isCreator && isManager) && (
                                                <Chip label="Thành viên" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: '#e0e0e0', height: 20, fontSize: '0.7rem' }} />
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
      </Box>
    </Container>
  );
}