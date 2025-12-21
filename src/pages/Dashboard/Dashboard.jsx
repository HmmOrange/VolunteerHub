import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllEvents } from "../../api/Events";
import { getAllPublicPosts } from "../../api/Posts";
import {
  Card,
  CardContent,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

import "./Dashboard.css";
import PostCard from "../../components/post/PostCard";
import PostModal from "../../components/post/PostModal";

export default function Dashboard() {
  const navigate = useNavigate(); 
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  const [upcomingJoinedEvents, setUpcomingJoinedEvents] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [hotEvents, setHotEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [upcomingScrollIndex, setUpcomingScrollIndex] = useState(0);
  
  // States cho infinite scroll
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [joinedEventIds, setJoinedEventIds] = useState([]);
  
  // States cho post modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  
  const observerTarget = useRef(null);

  // Helper function để render banner URL
  const getBannerUrl = (banner) => {
    if (!banner) return null;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner;
    const path = banner.startsWith("/") ? banner : `/${banner}`;
    return `http://localhost:5000${path}`;
  };

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

  // Hàm load posts với pagination - HIỂN THỊ TẤT CẢ POSTS CÔNG KHAI
  const loadMorePosts = useCallback(async () => {
    if (loadingPosts || !hasMorePosts) return;
    
    setLoadingPosts(true);
    try {
      const response = await getAllPublicPosts(postsPage, 5, userId);
      
      // Map posts để thêm event info
      const postsWithEventInfo = response.posts.map(p => ({
        ...p,
        event: p.eventId ? {
          _id: p.eventId._id,
          title: p.eventId.name,
          name: p.eventId.name,
          slug: p.eventId.slug
        } : p.event
      }));
      
      // Shuffle posts ngẫu nhiên
      const shuffledPosts = [...postsWithEventInfo].sort(() => Math.random() - 0.5);
      
      // Thêm vào mảng với deduplication dựa trên _id
      setFeedPosts(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const newPosts = shuffledPosts.filter(p => !existingIds.has(p._id));
        return [...prev, ...newPosts];
      });
      
      setHasMorePosts(response.hasMore);
      setPostsPage(prev => prev + 1);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  }, [loadingPosts, hasMorePosts, postsPage, userId]);

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

      // Lưu event IDs để dùng cho pagination
      const eventIds = joinedEvents.map(e => e._id);
      setJoinedEventIds(eventIds);

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

  // Load posts ban đầu - TẤT CẢ POSTS CÔNG KHAI
  useEffect(() => {
    if (feedPosts.length === 0 && userId) {
      loadMorePosts();
    }
  }, [userId]);

  // Intersection Observer cho infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loadingPosts) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMorePosts, hasMorePosts, loadingPosts]);

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
    <Box className="dashboard-container-split" sx={{ minHeight: '100vh', pb: { xs: 4, md: 2 } }}>
      <Typography 
        variant="h4" 
        textAlign="center" 
        fontWeight="bold" 
        gutterBottom 
        sx={{ 
          pt: { xs: 2, md: 3 },
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
          px: { xs: 2, md: 0 }
        }}
      >
        Xin chào, {username || "Người dùng"}!
      </Typography>

      {/* Container chính với độ rộng responsive */}
      <Box 
        sx={{ 
          width: { xs: '100%', sm: '95%', md: '90vw', lg: '75vw', xl: '70vw' },
          maxWidth: '100%',
          mx: 'auto',
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Sự kiện sắp diễn ra - Carousel */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 3, md: 4 }, mt: { xs: 2, md: 3 }, borderRadius: { xs: 2, md: 3 }, border: '2px solid #49BBBD' }}>
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            mb={2}
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
            }}
          >
            Sự kiện sắp diễn ra bạn đã tham gia
          </Typography>

        {upcomingJoinedEvents.length === 0 ? (
          <Typography color="text.secondary">
            Bạn không có sự kiện sắp diễn ra
          </Typography>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Nút trái - Hiện trên mobile */}
            {upcomingScrollIndex > 0 && (
              <IconButton
                onClick={() => setUpcomingScrollIndex(prev => Math.max(0, prev - 1))}
                sx={{
                  position: 'absolute',
                  left: { xs: -10, sm: -15, md: -20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'white',
                  boxShadow: 2,
                  width: { xs: '2rem', md: '2.5rem' },
                  height: { xs: '2rem', md: '2.5rem' },
                  '&:hover': { 
                    bgcolor: '#49BBBD', /* Màu nhấn */
                    color: 'white'
                  }
                }}
              >
                <ChevronLeft sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
            )}

            {/* Nút phải - Hiện trên mobile */}
            {upcomingScrollIndex < upcomingJoinedEvents.length - 1 && (
              <IconButton
                onClick={() => setUpcomingScrollIndex(prev => Math.min(upcomingJoinedEvents.length - 1, prev + 1))}
                sx={{
                  position: 'absolute',
                  right: { xs: -10, sm: -15, md: -20 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'white',
                  boxShadow: 2,
                  width: { xs: '2rem', md: '2.5rem' },
                  height: { xs: '2rem', md: '2.5rem' },
                  '&:hover': { 
                    bgcolor: '#49BBBD', /* Màu nhấn */
                    color: 'white'
                  }
                }}
              >
                <ChevronRight sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
              </IconButton>
            )}

            {/* Container chứa events - Carousel cho mọi màn hình */}
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 0, md: 2 },
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                pt: { xs: 1, md: 2 },
                pb: { xs: 1, md: 2 },
                mt: { xs: -1, md: -2 },
                mb: { xs: -1, md: -2 }
              }}
            >
              {upcomingJoinedEvents.map((event, index) => {
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
                  <Card
                    key={event._id}
                    className="event-card-clickable"
                    onClick={() => navigate(`/event/${event.slug}`)}
                    sx={{
                      minWidth: { xs: '100%', md: 'calc(33.33% - 11px)' },
                      maxWidth: { xs: '100%', md: 'calc(33.33% - 11px)' },
                      flexShrink: 0,
                      border: '2px solid #49BBBD',
                      transform: { 
                        xs: `translateX(-${upcomingScrollIndex * 100}%)`,
                        md: `translateX(-${upcomingScrollIndex * (100 / 3 + 0.67)}%)` 
                      },
                      transition: 'transform 0.3s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: { 
                          xs: `translateX(-${upcomingScrollIndex * 100}%) translateY(-4px)`,
                          md: `translateX(-${upcomingScrollIndex * (100 / 3 + 0.67)}%) translateY(-8px)` 
                        },
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                          mb: 0.5
                        }}
                      >
                        {event.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        display="block"
                        sx={{ 
                          color: eventStatusColor[calculateEventStatus(event)],
                          fontWeight: 'bold',
                          mb: 1,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        {eventStatusMap[calculateEventStatus(event)]}
                      </Typography>

                      {/* Event Banner */}
                      <Box
                        sx={{
                          width: '100%',
                          height: { xs: '120px', sm: '140px', md: '15vh' },
                          mb: 2,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {event.banner ? (
                          <img
                            src={getBannerUrl(event.banner)}
                            alt={event.name}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textAlign: 'center', p: 1 }}
                          >
                            No banner
                          </Typography>
                        )}
                      </Box>

                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        mb={1}
                        sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' },
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: { xs: 2, sm: 3 },
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {event.description}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                        <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                        <b>Ngày:</b> {new Date(event.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                        <b>Thời gian:</b> {renderTime(event.startTime, event.endTime)}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Bài viết và Sự kiện Hot - 65% và 30% */}
      <Box sx={{ mb: 4, display: 'flex', gap: { xs: 2, md: '2%' }, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' }, overflow: 'visible' }}>
        {/* Cột trái: Danh sách bài viết - 100% trên mobile, 65% trên desktop */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 65%' }, width: '100%', minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: { xs: 2, md: 3 }, border: '2px solid #49BBBD' }}>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              mb={2}
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
              }}
            >
              Bài viết từ các sự kiện bạn đã tham gia
            </Typography>

            {feedPosts.length === 0 && !loadingPosts ? (
              <Typography color="text.secondary" textAlign="center">
                Chưa có bài viết nào
              </Typography>
            ) : (
              <Stack spacing={2} alignItems="center">
                {feedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                    onPostClick={(post) => {
                      setSelectedPost(post);
                      setPostModalOpen(true);
                    }}
                  />
                ))}
                
                {/* Observer target cho infinite scroll */}
                <div ref={observerTarget} style={{ height: '20px', width: '100%' }} />
                
                {/* Loading indicator */}
                {loadingPosts && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress sx={{ color: '#49BBBD' }} />
                  </Box>
                )}
                
                {/* Hiển thị khi hết posts */}
                {!hasMorePosts && feedPosts.length > 0 && (
                  <Typography color="text.secondary" textAlign="center" py={2}>
                    Đã hiển thị tất cả bài viết
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* Cột phải: Sự kiện Hot - 30% - Ẩn trên mobile */}
        <Box sx={{ 
          display: { xs: 'none', md: 'block' },
          flex: { xs: '1 1 100%', md: '0 0 33%' }, 
          width: { xs: '100%', md: 'auto' },
          minWidth: 0, 
          height: 'fit-content', 
          position: { xs: 'relative', md: 'sticky' }, 
          top: { xs: 0, md: '10vh' },
          mt: { xs: 0, md: 0 }
        }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, sm: 2.5 }, 
              bgcolor: "#f5f5f5", 
              minHeight: { xs: 'auto', md: '400px' },
              borderRadius: { xs: 2, md: 3 },
              border: '2px solid #49BBBD'
            }}
          >
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                mb={2} 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1,
                  fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' }
                }}
              >
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
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          mb={0.5}
                          sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
                        >
                          {hotEvents[currentPage].name}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            color: calculateEventStatus(hotEvents[currentPage]) === 'upcoming' ? "#1976d2" : "#2e7d32",
                            fontWeight: "bold",
                            mb: 1.5,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          {calculateEventStatus(hotEvents[currentPage]) === 'upcoming' ? "Sắp diễn ra" : "Đang diễn ra"}
                        </Typography>

                        {/* Event Banner */}
                        <Box
                          sx={{
                            width: '100%',
                            height: { xs: '140px', sm: '160px', md: '15vh' },
                            mb: 2,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {hotEvents[currentPage].banner ? (
                            <img
                              src={getBannerUrl(hotEvents[currentPage].banner)}
                              alt={hotEvents[currentPage].name}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ textAlign: 'center', p: 1 }}
                            >
                              No banner
                            </Typography>
                          )}
                        </Box>

                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          mb={2} 
                          sx={{ 
                            lineHeight: 1.6,
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: { xs: 3, sm: 4 },
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {hotEvents[currentPage].description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" mb={1} sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                            <span style={{ fontSize: "1rem" }}>📍</span>
                            <strong>Địa điểm:</strong> {hotEvents[currentPage].location || "Chưa xác định"}
                          </Typography>
                          <Typography variant="body2" mb={1} sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' } }}>
                            <span style={{ fontSize: "1rem" }}>📅</span>
                            <strong>Ngày:</strong> {new Date(hotEvents[currentPage].date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary" sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.875rem' }, color: '#49BBBD' /* Màu nhấn */ }}>
                            <span style={{ fontSize: "1.2rem" }}>👥</span>
                            {hotEvents[currentPage].volunteers?.length || 0} thành viên đã tham gia
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pagination Dots */}
                  <Box sx={{ display: "flex", justifyContent: "center", gap: { xs: 1, sm: 1.5 }, mt: { xs: 2, sm: 3 } }}>
                    {hotEvents.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        sx={{
                          width: currentPage === index ? { xs: 28, sm: 40 } : { xs: 10, sm: 12 },
                          height: { xs: 10, sm: 12 },
                          borderRadius: { xs: 5, sm: 6 },
                          bgcolor: currentPage === index ? "#49BBBD" : "#ccc",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            bgcolor: currentPage === index ? "#328078" : "#999",
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

      {/* POST MODAL */}
      {selectedPost && (
        <PostModal
          open={postModalOpen}
          onClose={() => {
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onPostDeleted={(id) => {
            setFeedPosts(feedPosts.filter(p => p._id !== id));
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
          onPostUpdated={(updated) => {
            setFeedPosts(feedPosts.map(p => p._id === updated._id ? updated : p));
            setSelectedPost(updated);
          }}
        />
      )}
    </Box>
  );
}