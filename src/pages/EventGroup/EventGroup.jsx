import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  Tabs,
  Tab,
  Container, 
  Button, 
} from "@mui/material";

// Import file CSS
import "./EventGroup.css"; 

// Mock Data
const mockEventData = {
  name: "TeamTree",
  privacy: "Public", 
  memberCount: 123,
  description: "Đây là mô tả dài của sự kiện TeamTree...",
  location: "Công viên Thống Nhất, Hà Nội",
  date: "2025-11-10T10:00:00Z",
};

export default function EventGroup() {
  const { eventId } = useParams(); 
  const [eventData, setEventData] = useState(mockEventData); 
  const [currentTab, setCurrentTab] = useState(0); 

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
        
        {/* Tab 0: Bài đăng */}
        {currentTab === 0 && (
          <>
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography variant="h6">Nội dung Bài đăng (Post)</Typography>
            </Paper>
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography>Bài đăng 2</Typography>
            </Paper>
            {/* Thêm nhiều bài đăng để test cuộn trang */}
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography>Bài đăng 3</Typography>
            </Paper>
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography>Bài đăng 4</Typography>
            </Paper>
            <Paper className="temp-post-box" elevation={0} variant="outlined">
              <Typography>Bài đăng 5</Typography>
            </Paper>
          </>
        )}

        {/* Tab 1: Thông tin */}
        {currentTab === 1 && (
          <Paper className="temp-post-box info-tab" elevation={0} variant="outlined">
            <Typography variant="h6" gutterBottom>Thông tin sự kiện</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {eventData.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" gutterBottom>
              <b>Địa điểm:</b> {eventData.location}
            </Typography>
            <Typography variant="body1">
              <b>Thời gian:</b> {new Date(eventData.date).toLocaleString('vi-VN')}
            </Typography>
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