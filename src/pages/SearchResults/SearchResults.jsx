import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  CalendarToday,
  LocationOn,
  Person,
  Schedule,
  Group,
  CheckCircle,
  FilterList,
  Sort,
} from "@mui/icons-material";
import Fuse from "fuse.js";
import { searchEvents } from "../../api/Events";
import placeholderImage from "../../assets/img/event_group.jpg";
import "./SearchResults.css";

/*
  Page: `SearchResults`

  Mô tả:
  - Trang hiển thị kết quả tìm kiếm sự kiện theo query URL (`q`).
  - Sử dụng Fuse.js để fuzzy-search trên dữ liệu tải về từ `searchEvents`.
  - Hỗ trợ lọc trạng thái (upcoming/ongoing/completed/cancelled) và sắp xếp.
*/

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [sortBy, setSortBy] = useState("date"); // "date" hoặc "name"
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "upcoming", "ongoing", "completed", "cancelled"

  // Load tất cả events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const events = await searchEvents("");
        
        // Fuzzy search với threshold 75%
        if (query.trim() !== "") {
          const fuse = new Fuse(events, {
            keys: ["name", "description", "location"],
            threshold: 0.25, // ~75% match
            includeScore: true,
          });
          const results = fuse.search(query).map(result => result.item);
          setFilteredEvents(results);
        } else {
          setFilteredEvents(events);
        }
      } catch (err) {
        console.error("Lỗi tải events:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [query]);

  // Load search history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(history);
  }, []);

  const handleEventClick = (slug) => {
    navigate(`/event/${slug}`);
  };

  const handleHistoryClick = (historyQuery) => {
    navigate(`/search?q=${encodeURIComponent(historyQuery)}`);
  };

  const handleClearHistory = () => {
    localStorage.removeItem("searchHistory");
    setSearchHistory([]);
  };

  // Helper function để render banner URL
  const getBannerUrl = (banner) => {
    if (!banner) return placeholderImage;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner;
    const path = banner.startsWith("/") ? banner : `/${banner}`;
    return `http://localhost:5000${path}`;
  };

  // Tính toán trạng thái event
  const calculateEventStatus = (event) => {
    if (!event) return 'upcoming';
    
    // Nếu đã bị hủy
    if (event.eventStatus === 'cancelled') return 'cancelled';
    
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

  // Lấy thông tin trạng thái
  const getStatusInfo = (event) => {
    const status = calculateEventStatus(event);
    const statusMap = {
      upcoming: { label: "Sắp diễn ra", color: "info" },
      ongoing: { label: "Đang diễn ra", color: "success" },
      completed: { label: "Đã hoàn thành", color: "default" },
      cancelled: { label: "Đã bị hủy", color: "error" }
    };
    return statusMap[status] || statusMap.upcoming;
  };

  // Sort và filter events
  const getSortedAndFilteredEvents = () => {
    let events = [...filteredEvents];

    // Filter theo status
    if (filterStatus !== "all") {
      events = events.filter(event => calculateEventStatus(event) === filterStatus);
    }

    // Sort
    events.sort((a, b) => {
      if (sortBy === "date") {
        // Sort theo ngày bắt đầu
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === "name") {
        // Sort theo tên
        return a.name.localeCompare(b.name, 'vi');
      }
      return 0;
    });

    return events;
  };

  const displayEvents = getSortedAndFilteredEvents();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" className="search-results-container">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Typography variant="h4" gutterBottom>
          Kết quả tìm kiếm {query && `cho "${query}"`}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Tìm thấy {filteredEvents.length} sự kiện
        </Typography>

        {/* Sort and Filter Controls */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
          {/* Sort Dropdown */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: '12.5rem' }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel id="sort-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Sort fontSize="small" />
                Sắp xếp theo
              </Box>
            </InputLabel>
            <Select
              labelId="sort-label"
              value={sortBy}
              label="Sắp xếp theo"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="date">Thời gian</MenuItem>
              <MenuItem value="name">Tên sự kiện</MenuItem>
            </Select>
          </FormControl>

          {/* Filter - Toggle Buttons on desktop, Select on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterList fontSize="small" color="action" />
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) {
                  setFilterStatus(newValue);
                }
              }}
              size="small"
            >
              <ToggleButton value="all">Tất cả</ToggleButton>
              <ToggleButton value="upcoming">Sắp diễn ra</ToggleButton>
              <ToggleButton value="ongoing">Đang diễn ra</ToggleButton>
              <ToggleButton value="completed">Đã hoàn thành</ToggleButton>
              <ToggleButton value="cancelled">Đã hủy</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Filter - Select on mobile */}
          <FormControl size="small" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: { xs: '100%', sm: '12.5rem' }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel id="filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FilterList fontSize="small" />
                Lọc theo trạng thái
              </Box>
            </InputLabel>
            <Select
              labelId="filter-label"
              value={filterStatus}
              label="Lọc theo trạng thái"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
              <MenuItem value="ongoing">Đang diễn ra</MenuItem>
              <MenuItem value="completed">Đã hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Two column layout với flex */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          alignItems: 'flex-start', 
          flexWrap: { xs: 'wrap', lg: 'nowrap' } 
        }}>
          {/* Left side - Search Results */}
          <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 auto' }, minWidth: 0, width: '100%' }}>
            {displayEvents.length > 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2,
                justifyContent: 'flex-start'
              }}>
                {displayEvents.map((event) => (
                  <Box key={event._id} sx={{ 
                    width: { 
                      xs: '100%',                      // Mobile: 1 event/hàng
                      sm: 'calc(50% - 1rem)',          // Tablet nhỏ: 2 events/hàng
                      md: 'calc(50% - 1rem)',          // Tablet: 2 events/hàng
                      lg: 'calc(33.333% - 1.33rem)'    // Desktop: 3 events/hàng
                    },
                    flexGrow: 0, 
                    flexShrink: 0 
                  }}>
                    <Card 
                      className="search-result-card"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '2px solid #49BBBD',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 30px rgba(73, 187, 189, 0.2)',
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      <CardActionArea 
                        onClick={() => handleEventClick(event.slug)}
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                        }}
                      >
                        {/* Banner với kích thước cố định */}
                        <Box
                          sx={{
                            width: '100%',
                            height: '12rem',
                            backgroundColor: '#f5f5f5',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          <img
                            src={getBannerUrl(event.banner)}
                            alt={event.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center',
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = placeholderImage;
                            }}
                          />
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          {/* Tiêu đề và trạng thái */}
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 600 }}>
                              {event.name}
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              <Chip 
                                icon={<CheckCircle />}
                                label="Đã duyệt" 
                                size="small" 
                                color="success" 
                                sx={{ height: '1.25rem', fontSize: '0.7rem' }}
                              />
                              <Chip 
                                label={getStatusInfo(event).label}
                                size="small" 
                                color={getStatusInfo(event).color}
                                sx={{ height: '1.25rem', fontSize: '0.7rem' }}
                              />
                            </Stack>
                          </Box>
                          
                          {/* Thông tin chi tiết */}
                          <Stack spacing={0.8}>
                            {/* Ngày bắt đầu - kết thúc */}
                            <Box display="flex" alignItems="flex-start" gap={1}>
                              <CalendarToday sx={{ fontSize: '1rem', mt: 0.2 }} color="action" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {new Date(event.date).toLocaleDateString('vi-VN')}
                                {event.endDate && event.endDate !== event.date && (
                                  <> - {new Date(event.endDate).toLocaleDateString('vi-VN')}</>
                                )}
                              </Typography>
                            </Box>
                            
                            {/* Giờ bắt đầu - kết thúc */}
                            <Box display="flex" alignItems="flex-start" gap={1}>
                              <Schedule sx={{ fontSize: '1rem', mt: 0.2 }} color="action" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {event.startTime} - {event.endTime}
                              </Typography>
                            </Box>
                            
                            {/* Địa điểm */}
                            <Box display="flex" alignItems="flex-start" gap={1}>
                              <LocationOn sx={{ fontSize: '1rem', mt: 0.2 }} color="action" />
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: '0.85rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {event.location}
                              </Typography>
                            </Box>

                            {/* Số người tham gia */}
                            <Box display="flex" alignItems="flex-start" gap={1}>
                              <Group sx={{ fontSize: '1rem', mt: 0.2 }} color="action" />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {event.volunteersCount || 0} người tham gia
                              </Typography>
                            </Box>

                            {/* Người tạo */}
                            {event.createdBy && (
                              <Box display="flex" alignItems="flex-start" gap={1}>
                                <Person sx={{ fontSize: '1rem', mt: 0.2 }} color="action" />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  {event.createdBy.username}
                                </Typography>
                              </Box>
                            )}
                          </Stack>

                          {/* Mô tả */}
                          {event.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 1.5,
                                fontSize: '0.85rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {event.description}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', border: '2px solid #49BBBD' }}>
                <Typography variant="h6" color="text.secondary">
                  Không tìm thấy sự kiện nào phù hợp với từ khóa "{query}"
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Hãy thử tìm kiếm với từ khóa khác
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Right side - Sidebar - Sticky - Hidden on small screens */}
          <Box sx={{ 
            flex: { xs: '0 0 0', lg: '0 0 17%' }, 
            minWidth: { xs: 0, lg: '15rem' },
            width: { xs: 0, lg: 'auto' },
            height: 'fit-content',
            position: { xs: 'relative', lg: 'sticky' },
            top: '6.25rem',
            overflow: 'hidden',
            display: { xs: 'none', lg: 'block' }
          }}>
            {/* Lịch sử tìm kiếm */}
            <Paper sx={{ p: 2, mb: 2, border: '2px solid #49BBBD' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Lịch sử tìm kiếm</Typography>
                {searchHistory.length > 0 && (
                  <Chip
                    label="Xóa"
                    size="small"
                    onClick={handleClearHistory}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {searchHistory.length > 0 ? (
                <List>
                  {searchHistory.map((historyItem, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleHistoryClick(historyItem)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(73, 187, 189, 0.08)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={historyItem}
                        primaryTypographyProps={{
                          noWrap: true,
                          variant: 'body2',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Chưa có lịch sử tìm kiếm
                </Typography>
              )}
            </Paper>

            {/* Gợi ý liên quan */}
            {query && filteredEvents.length > 0 && (
              <Paper sx={{ p: 2, border: '2px solid #49BBBD' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Gợi ý liên quan
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  {filteredEvents.slice(0, 5).map((event) => (
                    <Chip
                      key={event._id}
                      label={event.name}
                      onClick={() => handleEventClick(event.slug)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: '#49BBBD',
                          color: 'white'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
