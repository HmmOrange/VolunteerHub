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
} from "@mui/material";

// Import API
import { getEventBySlug } from "../../api/Events"; 
import { getPostsByEvent } from "../../api/Posts"; 

// Import components
import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";

// Import file CSS
import "./EventGroup.css"; 

export default function EventGroup() {
  const { slug } = useParams(); 
  const [eventData, setEventData] = useState(null); 
  const [posts, setPosts] = useState([]); 
  const [currentTab, setCurrentTab] = useState(0); 
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Hook để tải EventData (dùng slug)
  useEffect(() => {
    if (slug) {
      setEventData(null); 
      (async () => {
        try {
          const data = await getEventBySlug({ slug }); 
          setEventData(data);
        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [slug]); 

  // Hook để tải Posts (dùng eventId từ eventData)
  useEffect(() => {
    if (currentTab === 0 && eventData?._id) { 
      const eventId = eventData._id; 
      setIsLoadingPosts(true);
      (async () => {
        try {
          const data = await getPostsByEvent(eventId);
          setPosts(data);
        } catch (error) {
          console.error("Failed to fetch posts:", error);
          setPosts([]); 
        }
        setIsLoadingPosts(false);
      })();
    }
  }, [eventData, currentTab]); 

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Callback khi post mới được tạo
  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]); 
  };

  // === THÊM HÀM NÀY (DELETE) ===
  // Hàm này được gọi từ PostCard khi xóa thành công
  const handlePostDeleted = (deletedPostId) => {
    // Lọc và xóa post ra khỏi state
    setPosts(posts.filter(post => post._id !== deletedPostId));
  };

  // === THÊM HÀM NÀY (UPDATE) ===
  // Hàm này được gọi từ PostCard khi sửa thành công
  const handlePostUpdated = (updatedPost) => {
    // Cập nhật nội dung của post trong state
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      
      {/* Thanh Tabs */}
      <Paper className="event-group-tabs-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 0 16px' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              flexGrow: 1, 
              '& .Mui-selected': { color: '#49BBBD !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#49BBBD' }
            }}
          >
            <Tab label="Bài đăng" />
            <Tab label="Thông tin" />
            <Tab label="Chỉnh sửa" />
          </Tabs>
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#49BBBD',
              color: 'white',
              '&:hover': { backgroundColor: '#3c9a9a' },
              ml: 2, 
              whiteSpace: 'nowrap'
            }}
          >
            + Mời
          </Button>
        </Box>
      </Paper>

      {/* Nội dung các Tabs */}
      <Box className="event-group-content-area">
        
        {/* Tab 0: Bài đăng */}
        {currentTab === 0 && (
          <>
            <CreatePost 
              eventId={eventData?._id} 
              onPostCreated={handlePostCreated} 
            />
            
            {isLoadingPosts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : posts.length === 0 ? (
              <Typography textAlign="center">Chưa có bài đăng nào.</Typography>
            ) : (
              // === CẬP NHẬT TRONG .map() ===
              posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onPostDeleted={handlePostDeleted} // <-- Thêm prop
                  onPostUpdated={handlePostUpdated} // <-- Thêm prop
                />
              ))
            )}
          </>
        )}

        {/* Tab 1: Thông tin */}
        {currentTab === 1 && (
          <Paper className="temp-post-box info-tab" elevation={0} variant="outlined">
            {!eventData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>Thông tin sự kiện</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {eventData.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body1">
                  <b>Địa điểm:</b> {eventData.location}
                </Typography>
                <Typography variant="body1">
                  <b>Thời gian:</b> {new Date(eventData.date).toLocaleString('vi-VN')}
                </Typography>
                <Typography variant="body1">
                  <b>Người tạo:</b> {eventData.createdBy?.username || 'Không rõ'}
                </Typography>
              </>
            )}
          </Paper>
        )}

        {/* Tab 2: Chỉnh sửa */}
        {currentTab === 2 && (
          <Paper className="temp-post-box" elevation={0} variant="outlined">
            <Typography variant="h6">Trang Chỉnh sửa sự kiện</Typography>
            <Typography>(Chưa có nội dung)</Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}