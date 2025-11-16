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
  CircularProgress, // Vòng xoay tải
} from "@mui/material";

// Import API
import { getEventById } from "../../api/Events"; 
import { getPostsByEvent } from "../../api/Posts"; // API mới cho bài đăng

// Import components
import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";

// Import file CSS
import "./EventGroup.css"; 

export default function EventGroup() {
  const { eventId } = useParams(); 
  const [eventData, setEventData] = useState(null); // State cho thông tin sự kiện
  const [posts, setPosts] = useState([]); // State mới cho bài đăng
  const [currentTab, setCurrentTab] = useState(0); 

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Hook để tải THÔNG TIN SỰ KIỆN (cho Tab "Thông tin")
  useEffect(() => {
    if (eventId) {
      setEventData(null); // Xóa dữ liệu cũ
      (async () => {
        try {
          const data = await getEventById({ eventId });
          setEventData(data);
        } catch (error) {
          console.error("Failed to fetch event data:", error);
        }
      })();
    }
  }, [eventId]);

  // Hook để tải CÁC BÀI ĐĂNG (cho Tab "Bài đăng")
  useEffect(() => {
    // Chỉ tải khi eventId tồn tại VÀ đang ở Tab "Bài đăng" (tab 0)
    if (eventId && currentTab === 0) { 
      setIsLoadingPosts(true);
      (async () => {
        try {
          const data = await getPostsByEvent(eventId);
          setPosts(data);
        } catch (error) {
          console.error("Failed to fetch posts:", error);
          setPosts([]); // Đặt mảng rỗng nếu lỗi
        }
        setIsLoadingPosts(false);
      })();
    }
  }, [eventId, currentTab]); // Chạy lại khi eventId hoặc Tab thay đổi

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Hàm này được gọi bởi <CreatePost /> sau khi tạo post thành công
  const handlePostCreated = (newPost) => {
    // Thêm post mới (đã được populate từ API) vào đầu danh sách
    setPosts([newPost, ...posts]); 
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
            {/* Component tạo bài đăng */}
            <CreatePost eventId={eventId} onPostCreated={handlePostCreated} />
            
            {/* <Divider sx={{ mb: 2 }} /> */}
            
            {/* Hiển thị danh sách bài đăng */}
            {isLoadingPosts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : posts.length === 0 ? (
              <Typography textAlign="center">Chưa có bài đăng nào.</Typography>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </>
        )}

        {/* Tab 1: Thông tin */}
        {currentTab === 1 && (
          <Paper className="temp-post-box info-tab" elevation={0} variant="outlined">
            {/* Thêm kiểm tra 'loading' */}
            {!eventData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              // Render dữ liệu thật
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