import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllEvents } from "../../api/Events";
import { getPostsByEvent } from "../../api/Posts";
import {
  Card,
  CardContent,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
  Box,
} from "@mui/material";

import "./Dashboard.css";
import PostCard from "../../components/post/PostCard";

export default function Dashboard() {
  const navigate = useNavigate(); 
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  const [upcomingJoinedEvents, setUpcomingJoinedEvents] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [hotEvents, setHotEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  // === HÀM TÍNH TRẠNG THÁI TỰ ĐỘNG ===
  const calculateEventStatus = (event) => {
    if (!event) return 'upcoming';
    
    // Chỉ giữ trạng thái cancelled nếu đã bị hủy
    if (event.eventStatus === 'cancelled') return 'cancelled';
    
    // Còn lại tất cả dựa vào thời gian thực tế
    const now = new Date();
    const startDate = new Date(event.date);
    if (event.startTime) {
      const [h, m] = event.startTime.split(':');
      startDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    const endDate = new Date(event.endDate || event.date);
    if (event.endTime) {
      const [h, m] = event.endTime.split(':');
      endDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const events = (await getAllEvents()).filter(
        (event) => event.status === "approved"
      );


      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // ===== JOINED EVENTS =====
      const joinedEvents = events.filter((event) =>
        event.volunteers?.some((v) =>
          typeof v === "string"
            ? v === userId
            : v._id?.toString() === userId
        )
      );

      // ===== UPCOMING (DATE + TIME) =====
      const upcoming = joinedEvents.filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);

        if (eventDate > today) return true;

        if (eventDate.getTime() === today.getTime()) {
          if (!event.startTime) return true;
          const [h, m] = event.startTime.split(":").map(Number);
          const eventTime = new Date(today);
          eventTime.setHours(h, m, 0, 0);
          return eventTime >= now;
        }
        return false;
      });

      upcoming.sort((a, b) => {
        const d1 = new Date(a.date);
        const d2 = new Date(b.date);
        if (d1.getTime() !== d2.getTime()) return d1 - d2;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });

      setUpcomingJoinedEvents(upcoming);

      // ===== POSTS FEED (JOINED EVENTS) =====
      const postsArrays = await Promise.all(
        joinedEvents.map(async (event) => {
          const posts = await getPostsByEvent(event._id);
          
          // --- SỬA ĐOẠN NÀY ---
          // Thay vì chỉ map eventName, hãy map cả object event 
          // để PostCard có thể lấy được event._id (dùng khi click chuyển trang)
          return posts.map(p => ({ 
            ...p, 
            event: {
              _id: event._id,
              title: event.name, // PostCard dùng .title hoặc .name đều được
              name: event.name,
              slug: event.slug   // Thêm slug nếu muốn navigate theo slug
            } 
          }));
          // --------------------
        })
      );

      const sortedPosts = postsArrays
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFeedPosts(sortedPosts);

      // ===== HOT EVENTS (SẮP DIỄN RA + ĐANG DIỄN RA, NHIỀU THÀNH VIÊN NHẤT) =====
      const hotEventCandidates = events.filter((event) => {
        const status = calculateEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      });

      // Sắp xếp theo số lượng thành viên giảm dần
      hotEventCandidates.sort((a, b) => {
        const countA = a.volunteers?.length || 0;
        const countB = b.volunteers?.length || 0;
        return countB - countA;
      });

      // Lấy top 3 sự kiện hot
      let topHotEvents = hotEventCandidates.slice(0, 3);
      
      // Thêm dữ liệu mẫu nếu không có đủ sự kiện
      if (topHotEvents.length < 3) {
        const mockEvents = [
          {
            _id: 'mock1',
            name: 'Chiến dịch Mùa hè xanh 2025',
            description: 'Tham gia hoạt động tình nguyện hè ý nghĩa cùng sinh viên toàn quốc. Mang tri thức và niềm vui đến với trẻ em vùng cao.',
            location: 'Hà Giang',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            startTime: '07:00',
            endTime: '17:00',
            slug: 'mua-he-xanh-2025',
            volunteers: Array(127).fill(null),
            eventStatus: 'approved'
          },
          {
            _id: 'mock2',
            name: 'Hiến máu nhân đạo - Giọt hồng yêu thương',
            description: 'Chương trình hiến máu tình nguyện nhằm góp phần cứu người và lan toả tinh thần nhân ái trong cộng đồng.',
            location: 'Bệnh viện Trung ương, Hà Nội',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            startTime: '08:00',
            endTime: '16:00',
            slug: 'hien-mau-nhan-dao',
            volunteers: Array(89).fill(null),
            eventStatus: 'approved'
          },
          {
            _id: 'mock3',
            name: 'Dọn rác biển Sầm Sơn',
            description: 'Chung tay bảo vệ môi trường biển, làm sạch bãi biển và nâng cao ý thức cộng đồng về bảo vệ thiên nhiên.',
            location: 'Bãi biển Sầm Sơn, Thanh Hóa',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            startTime: '06:00',
            endTime: '11:00',
            slug: 'don-rac-bien-sam-son',
            volunteers: Array(65).fill(null),
            eventStatus: 'approved'
          },
          {
            _id: 'mock4',
            name: 'Trồng cây xanh tại Công viên Thống Nhất',
            description: 'Góp phần tạo không gian xanh cho thành phố, cải thiện môi trường sống và nâng cao ý thức bảo vệ thiên nhiên.',
            location: 'Công viên Thống Nhất, TP.HCM',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            startTime: '07:30',
            endTime: '10:30',
            slug: 'trong-cay-xanh',
            volunteers: Array(52).fill(null),
            eventStatus: 'approved'
          },
          {
            _id: 'mock5',
            name: 'Trao quà Trung thu cho trẻ em vùng sâu',
            description: 'Mang Trung thu đến với các em nhỏ ở vùng sâu, vùng xa với những phần quà ý nghĩa và niềm vui ngày hội.',
            location: 'Các xã vùng cao Lào Cai',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            startTime: '08:00',
            endTime: '15:00',
            slug: 'trao-qua-trung-thu',
            volunteers: Array(43).fill(null),
            eventStatus: 'approved'
          }
        ];
        
        topHotEvents = [...topHotEvents, ...mockEvents].slice(0, 3);
      }
      
      setHotEvents(topHotEvents);
    })();
  }, [userId]);

  const renderTime = (start, end) => {
    if (!start) return "Không rõ thời gian";
    return end ? `${start} – ${end}` : start;
  };

  const handlePostDeleted = (postId) => {
    setFeedPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setFeedPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  // Auto-slide cho sự kiện hot
  useEffect(() => {
    if (hotEvents.length === 0) return;
    
    // Reset về trang 0 nếu currentPage vượt quá số lượng sự kiện
    if (currentPage >= hotEvents.length) {
      setCurrentPage(0);
    }
    
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % hotEvents.length);
    }, 15000); // 15 giây

    return () => clearInterval(interval);
  }, [hotEvents, currentPage]);

  return (
    <Box className="dashboard-container-split" sx={{ minHeight: '100vh' }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom sx={{ pt: 3 }}>
        Xin chào, {username || "Người dùng"}!
      </Typography>

      {/* Container chính với độ rộng responsive */}
      <Box 
        sx={{ 
          width: { xs: '100%', md: '90vw', lg: '70vw' },
          maxWidth: '100%',
          mx: 'auto',
        }}
      >
        {/* Sự kiện sắp diễn ra - 100% chiều rộng container */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Sự kiện sắp diễn ra bạn đã tham gia
          </Typography>

        {upcomingJoinedEvents.length === 0 ? (
          <Typography color="text.secondary">
            Bạn không có sự kiện sắp diễn ra
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {upcomingJoinedEvents.map((event) => {
              const eventStatusMap = {
                upcoming: "Sắp diễn ra",
                ongoing: "Đang diễn ra",
                completed: "Đã hoàn thành",
                cancelled: "Đã bị hủy"
              };

              const eventStatusColor = {
                upcoming: "#1976d2",
                ongoing: "#2e7d32",
                completed: "#757575",
                cancelled: "#d32f2f"
              };

              return (
                <Grid item xs={12} sm={6} md={4} key={event._id}>
                  <Card
                    className="event-card-clickable"
                    onClick={() => navigate(`/event/${event.slug}`)}
                  >
                    <CardContent>
                      <Typography variant="h6">{event.name}</Typography>
                      <Typography 
                        variant="caption" 
                        display="block"
                        sx={{ 
                          color: eventStatusColor[calculateEventStatus(event)],
                          fontWeight: 'bold',
                          mb: 1
                        }}
                      >
                        {eventStatusMap[calculateEventStatus(event)]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {event.description}
                      </Typography>
                      <Typography variant="body2">
                        <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                      </Typography>
                      <Typography variant="body2">
                        <b>Ngày:</b> {new Date(event.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <b>Thời gian:</b> {renderTime(event.startTime, event.endTime)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Bài viết và Sự kiện Hot - 65% và 30% */}
      <Box sx={{ mb: 4, display: 'flex', gap: '2%', alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' }, overflow: 'visible' }}>
        {/* Cột trái: Danh sách bài viết - 65% */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 65%' }, minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Bài viết từ các sự kiện bạn đã tham gia
            </Typography>

            {feedPosts.length === 0 ? (
              <Typography color="text.secondary" textAlign="center">
                Chưa có bài viết nào
              </Typography>
            ) : (
              <Stack spacing={2} alignItems="center">
                {feedPosts.map((post) => (
                  <Box key={post._id} sx={{ width: "100%" }}>
                    <PostCard
                      post={post}
                      onPostDeleted={handlePostDeleted}
                      onPostUpdated={handlePostUpdated}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* Cột phải: Sự kiện Hot - 30% */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33%' }, minWidth: 0, height: 'fit-content', position: { xs: 'relative', md: 'sticky' }, top: '10vh' }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2.5, 
              bgcolor: "#f5f5f5", 
              minHeight: "400px",
            }}
          >
              <Typography variant="h6" fontWeight="bold" mb={2} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                🔥 Sự kiện Hot
              </Typography>

              {hotEvents.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Không có sự kiện hot
                </Typography>
              ) : (
                <>
                  {/* Hiển thị sự kiện của trang hiện tại */}
                  {hotEvents[currentPage] && (
                    <Card
                      className="event-card-clickable"
                      onClick={() => navigate(`/event/${hotEvents[currentPage].slug}`)}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 6,
                        },
                        height: "100%",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight="bold" mb={0.5}>
                          {hotEvents[currentPage].name}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            color: calculateEventStatus(hotEvents[currentPage]) === 'upcoming' ? "#1976d2" : "#2e7d32",
                            fontWeight: "bold",
                            mb: 1.5,
                          }}
                        >
                          {calculateEventStatus(hotEvents[currentPage]) === 'upcoming' ? "Sắp diễn ra" : "Đang diễn ra"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
                          {hotEvents[currentPage].description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" mb={1} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <span style={{ fontSize: "1rem" }}>📍</span>
                            <strong>Địa điểm:</strong> {hotEvents[currentPage].location || "Chưa xác định"}
                          </Typography>
                          <Typography variant="body2" mb={1} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <span style={{ fontSize: "1rem" }}>📅</span>
                            <strong>Ngày:</strong> {new Date(hotEvents[currentPage].date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <span style={{ fontSize: "1.2rem" }}>👥</span>
                            {hotEvents[currentPage].volunteers?.length || 0} thành viên đã tham gia
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pagination Dots */}
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 3 }}>
                    {hotEvents.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        sx={{
                          width: currentPage === index ? 40 : 12,
                          height: 12,
                          borderRadius: 6,
                          bgcolor: currentPage === index ? "primary.main" : "#ccc",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            bgcolor: currentPage === index ? "primary.dark" : "#999",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}