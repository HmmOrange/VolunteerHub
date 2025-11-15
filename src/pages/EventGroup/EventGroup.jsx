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
  CircularProgress, // Thêm vòng xoay tải
} from "@mui/material";

// 1. Import hàm API mới
import { getEventById } from "../../api/Events";
import "./EventGroup.css"; 

export default function EventGroup() {
  const { eventId } = useParams(); 
  const [eventData, setEventData] = useState(null); // 2. Bắt đầu với state rỗng
  const [currentTab, setCurrentTab] = useState(0); 

  // 3. Dùng useEffect để gọi API
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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
        
        {/* Tab 0: Bài đăng (Vẫn giữ tạm) */}
        {currentTab === 0 && (
          <>
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography variant="h6">Nội dung Bài đăng (Post)</Typography>
              <Typography>(Sau này sẽ lấy từ collection 'posts')</Typography>
            </Paper>
            {/* (Các bài đăng khác) ... */}
          </>
        )}

        {/* Tab 1: Thông tin (Sửa tại đây) */}
        {currentTab === 1 && (
          <Paper className="temp-post-box info-tab" elevation={0} variant="outlined">
            {/* 4. Thêm kiểm tra 'loading' */}
            {!eventData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              // 5. Render dữ liệu thật (bỏ 'Đã duyệt')
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