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

/*
  Page: `Landing`

  Mô tả:
  - Trang landing marketing trình bày tính năng chính của ứng dụng và kêu gọi đăng ký/đăng nhập.
  - Sử dụng `ThemeProvider` cục bộ để tùy chỉnh theme cho phần landing.
  - Không chứa logic API nặng, chủ yếu render UI tĩnh và điều hướng.
*/

export default function Landing() {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* --- NAVBAR --- */}
      <AppBar position="fixed" elevation={1} sx={{ bgcolor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ height: { xs: 56, sm: 64 }, justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={{ xs: 0.5, sm: 1 }} 
              onClick={() => navigate("/")} 
              sx={{ cursor: 'pointer' }}
            >
              <VolunteerActivismIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: '#49BBBD' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                <Box component="span" sx={{ color: '#000000' }}>Volunteer</Box>
                <Box component="span" sx={{ color: '#49BBBD' }}>Hub</Box>
              </Typography>
            </Stack>

            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
              <Button 
                variant="text" 
                sx={{ 
                  color: '#2D3436',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  px: { xs: 1, sm: 2 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#49BBBD',
                    backgroundColor: 'rgba(73, 187, 189, 0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </Button>
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: '#49BBBD', 
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  px: { xs: 2, sm: 3 },
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(73, 187, 189, 0.3)',
                  '&:hover': { 
                    bgcolor: '#3daeb0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(73, 187, 189, 0.4)'
                  }
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
        pt: { xs: 12, sm: 16, md: 20 }, 
        pb: { xs: 6, sm: 8, md: 10 }, 
        minHeight: { xs: '70vh', sm: '80vh', md: '85vh' },
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `
          linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 90%),
          url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        px: { xs: 2, sm: 3 }
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          
          <Typography variant="h2" sx={{ color: '#2D3436', mb: { xs: 0.5, sm: 1 }, fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.75rem' } }}>
            Kết Nối Trái Tim
          </Typography>
          <Typography variant="h2" sx={{ color: '#49BBBD', mb: { xs: 2, sm: 3 }, fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.75rem' } }}>
            Lan Tỏa Yêu Thương
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 4, sm: 5, md: 6 }, maxWidth: '700px', mx: 'auto', fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.8, px: { xs: 1, sm: 0 } }}>
            Hệ sinh thái thiện nguyện minh bạch. Nơi bạn tự do <strong>tạo sự kiện</strong>, 
            tìm kiếm đồng đội và xây dựng hồ sơ tình nguyện ấn tượng cho riêng mình.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate("/register")}
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                px: { xs: 4, sm: 5 }, 
                py: { xs: 1.2, sm: 1.5 }, 
                fontSize: { xs: '1rem', sm: '1.1rem' }, 
                boxShadow: '0 10px 20px rgba(73, 187, 189, 0.3)',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Tham gia ngay
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              endIcon={<PlayCircleOutlineIcon />}
              sx={{ 
                borderColor: '#b2bec3', 
                color: '#636E72', 
                px: { xs: 4, sm: 4 }, 
                py: { xs: 1.2, sm: 1.5 }, 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { borderColor: '#49BBBD', color: '#49BBBD' }
              }}
            >
              Tìm hiểu thêm
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* --- FEATURES SECTION --- */}
      <Box sx={{ pb: { xs: 8, sm: 12, md: 15 }, bgcolor: '#ffffff', px: { xs: 2, sm: 3 } }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={{ xs: 5, sm: 6, md: 8 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2D3436', mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
              Tính Năng Nổi Bật
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, px: { xs: 2, sm: 0 } }}>
              Mọi công cụ bạn cần để bắt đầu hành trình thiện nguyện.
            </Typography>
          </Box>

          {/* SỬ DỤNG VÒNG LẶP ĐỂ ĐẢM BẢO CÁC Ô ĐỀU NHAU TUYỆT ĐỐI */}
          <Grid container spacing={{ xs: 3, sm: 3, md: 4 }} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: 'flex' }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: { xs: 3, sm: 3.5, md: 4 }, 
                    textAlign: 'center', 
                    width: '100%',
                    // Flex column và flex: 1 giúp card tự giãn đều theo chiều cao của hàng
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    flex: 1, 
                    border: '2px solid #49BBBD',
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
                      width: { xs: 60, sm: 65, md: 70 }, 
                      height: { xs: 60, sm: 65, md: 70 }, 
                      mx: 'auto', 
                      mb: { xs: 2, sm: 2.5, md: 3 } 
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ minHeight: { xs: '28px', sm: '30px', md: '32px' }, fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

        </Container>
      </Box>

      {/* --- FOOTER --- */}
      <Box sx={{ bgcolor: '#f1f4f7', py: 4, textAlign: 'center', borderTop: '2px solid #49BBBD' }}>
        <Container>
          <Typography variant="body2" color="text.secondary">
            © 2025 VolunteerHub Social Network.
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}