import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Grid, 
  Stack,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Paper
} from "@mui/material";

// Import Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import BadgeIcon from '@mui/icons-material/Badge'; 
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// --- CẤU HÌNH THEME ---
const theme = createTheme({
  palette: {
    primary: {
      main: "#49BBBD", 
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2F3542",
    },
    background: {
      default: "#ffffff",
    }
  },
  typography: {
    fontFamily: '"Be Vietnam Pro", "Roboto", "Arial", sans-serif',
    button: { 
      fontWeight: 600, 
      textTransform: 'none',
    } 
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
        },
      },
    },
  },
});

// --- DỮ LIỆU TÍNH NĂNG (Gom lại để render vòng lặp cho đều nhau) ---
const features = [
  {
    title: "Tạo Sự Kiện",
    desc: "Dễ dàng khởi tạo chiến dịch, thiết lập thời gian và tuyển thành viên chỉ trong vài bước.",
    icon: <CalendarMonthIcon fontSize="large" />
  },
  {
    title: "Tìm Đồng Đội",
    desc: "Kết nối với hàng ngàn tình nguyện viên cùng chí hướng. Chat nhóm và thảo luận trực tiếp.",
    icon: <GroupsIcon fontSize="large" />
  },
  {
    title: "Chia Sẻ",
    desc: "Đăng tải hình ảnh, nhật ký hành trình lên Newfeed để lan tỏa cảm hứng tới cộng đồng.",
    icon: <AddReactionIcon fontSize="large" />
  },
  {
    title: "Hồ Sơ CV",
    desc: "Lưu giữ lịch sử hoạt động. Xây dựng profile tình nguyện chuyên nghiệp để làm đẹp CV.",
    icon: <BadgeIcon fontSize="large" />
  }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* --- NAVBAR --- */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: '#49BBBD' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ height: 64, justifyContent: 'space-between' }}>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1} 
              onClick={() => navigate("/")} 
              sx={{ cursor: 'pointer' }}
            >
              <VolunteerActivismIcon sx={{ fontSize: 32, color: '#ffffff' }} />
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                VolunteerHub
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button 
                variant="text" 
                sx={{ color: '#ffffff', display: { xs: 'none', sm: 'block' } }}
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </Button>
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: '#ffffff', 
                  color: '#49BBBD',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#f1f1f1' }
                }}
                onClick={() => navigate("/register")}
              >
                Đăng ký ngay
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* --- HERO SECTION --- */}
      <Box sx={{ 
        pt: 20, 
        pb: 10, 
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `
          linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 90%),
          url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          
          <Box 
            sx={{ 
              display: 'inline-block', 
              border: '1px solid #49BBBD', 
              color: '#49BBBD', 
              px: 3, py: 1, 
              borderRadius: 20, 
              mb: 4,
              fontWeight: 600
            }}
          >
             👋 Mạng xã hội kết nối thiện nguyện
          </Box>

          <Typography variant="h2" sx={{ color: '#2D3436', mb: 1, fontWeight: 800 }}>
            Kết Nối Trái Tim
          </Typography>
          <Typography variant="h2" sx={{ color: '#49BBBD', mb: 3, fontWeight: 800 }}>
            Lan Tỏa Yêu Thương
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: '700px', mx: 'auto', fontSize: '1.1rem', lineHeight: 1.8 }}>
            Hệ sinh thái thiện nguyện minh bạch. Nơi bạn tự do <strong>tạo sự kiện</strong>, 
            tìm kiếm đồng đội và xây dựng hồ sơ tình nguyện ấn tượng cho riêng mình.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate("/register")}
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 5, py: 1.5, fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(73, 187, 189, 0.3)' }}
            >
              Tham gia ngay
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              endIcon={<PlayCircleOutlineIcon />}
              sx={{ 
                borderColor: '#b2bec3', color: '#636E72', px: 4, py: 1.5, fontSize: '1.1rem',
                '&:hover': { borderColor: '#49BBBD', color: '#49BBBD' }
              }}
            >
              Tìm hiểu thêm
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* --- FEATURES SECTION --- */}
      <Box sx={{ pb: 15, bgcolor: '#ffffff' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={8}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2D3436', mb: 2 }}>
              Tính Năng Nổi Bật
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Mọi công cụ bạn cần để bắt đầu hành trình thiện nguyện.
            </Typography>
          </Box>

          {/* SỬ DỤNG VÒNG LẶP ĐỂ ĐẢM BẢO CÁC Ô ĐỀU NHAU TUYỆT ĐỐI */}
          <Grid container spacing={4} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    width: '500px',
                    // Flex column và flex: 1 giúp card tự giãn đều theo chiều cao của hàng
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    flex: 1, 
                    border: '1px solid #49BBBD',
                    borderRadius: 4, 
                    bgcolor: '#ffffff',
                    transition: 'all 0.3s',
                    '&:hover': { 
                      bgcolor: '#F0FDFD', 
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(73, 187, 189, 0.25)'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(73, 187, 189, 0.1)', 
                      color: '#49BBBD', 
                      width: 70, 
                      height: 70, 
                      mx: 'auto', 
                      mb: 3 
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ minHeight: '32px' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

        </Container>
      </Box>

      {/* --- FOOTER --- */}
      <Box sx={{ bgcolor: '#F9F9F9', py: 4, textAlign: 'center', borderTop: '1px solid #eee' }}>
        <Container>
          <Typography variant="body2" color="text.secondary">
            © 2025 VolunteerHub Social Network.
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}