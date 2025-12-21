import { useState, useRef, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Box,
  Avatar,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
} from "@mui/material";
import {
  ImageOutlined as ImageIcon,
  PersonAddOutlined as TagIcon,
  LocationOnOutlined as LocationIcon,
  Close as CloseIcon, 
} from "@mui/icons-material";
import "./Post.css"; 

import { createPost, uploadImage } from "../../api/Posts"; 
import validators from "../../utils/validators";

export default function CreatePost({ eventId, onPostCreated }) {
  const navigate = useNavigate();
  
  // === 1. LẤY THÔNG TIN TỪ LOCALSTORAGE ===
  const username = localStorage.getItem("username") || "Người dùng";
  const avatar = localStorage.getItem("avatar"); 
  const role = localStorage.getItem("role"); // Lấy thêm role để tô màu
  const { showToast } = useToast();
  // ==========================================
    
  const [isExpanded, setIsExpanded] = useState(false); 
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
    
  const [triggerUpload, setTriggerUpload] = useState(false); 
  const fileInputRef = useRef(null);

  // === 2. CÁC HÀM XỬ LÝ HIỂN THỊ AVATAR ===
  
  // A. Xử lý URL ảnh
  const getAvatarUrl = () => {
    if (!avatar) return undefined;
    if (avatar.startsWith("http")) return avatar;
    const path = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `http://localhost:5000${path}`;
  };

  // B. Lấy màu theo Role
  const getAvatarColor = (userRole) => {
    switch (userRole) {
      case 'manager':
        return '#49BBBD'; // Xanh Manager
      case 'admin':
        return '#d32f2f'; // Đỏ Admin
      case 'volunteer':
        return '#9e9e9e'; // Xám Tình nguyện viên
      default:
        return '#9c27b0'; // Tím User/Creator
    }
  };

  // C. Logic hiển thị (Ẩn danh vs Có ảnh vs Chỉ có tên)
  const renderAvatarProps = () => {
    // 1. Nếu đang bật chế độ ẩn danh -> Dấu ? + Màu Volunteer
    if (isAnonymous) {
      return {
        src: undefined,
        children: '?',
        sx: { bgcolor: '#9e9e9e', cursor: 'default' } 
      };
    }

    // 2. Nếu User thật có ảnh -> Hiện ảnh + Nền trong suốt
    if (avatar) {
      return {
        src: getAvatarUrl(),
        children: null,
        sx: { bgcolor: 'transparent', cursor: 'pointer' }
      };
    }

    // 3. Nếu User thật không có ảnh -> Chữ cái đầu + Màu theo Role
    return {
      src: undefined,
      children: username.charAt(0).toUpperCase(),
      sx: { bgcolor: getAvatarColor(role), cursor: 'pointer' }
    };
  };
  // ==========================================

  useEffect(() => {
    if (isExpanded && triggerUpload) {
      fileInputRef.current.click();
      setTriggerUpload(false); 
    }
  }, [isExpanded, triggerUpload]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setPostContent("");
    setImageFile(null); 
    setImagePreview(null); 
    setIsAnonymous(false);
  };

  const handleSubmit = async () => {
    if (!eventId) {
      showToast("Đang tải dữ liệu sự kiện, vui lòng thử lại sau giây lát.", "warning");
      return;
    }
    // validate post content
    if (!postContent || !postContent.trim()) {
      showToast('Nội dung bài viết không được để trống', 'warning');
      return;
    }

    setIsLoading(true);
    let finalImageUrl = null; 

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile); 
        const uploadRes = await uploadImage(formData);
        finalImageUrl = uploadRes.imageUrl; 
      }

      const newPost = await createPost({
        content: postContent,
        isAnonymous,
        eventId,
        username,
        imageUrl: finalImageUrl, 
      });

      onPostCreated(newPost); 
      handleCancel(); 

    } catch (error) {
      console.error("Không thể tạo bài đăng:", error);
      showToast("Không thể tạo bài đăng, vui lòng thử lại.", "error");
    }
    
    setIsLoading(false);
  };
    
  // === RENDER TRẠNG THÁI ĐƠN GIẢN (COLLAPSED) ===
  if (!isExpanded) {
    // Ở trạng thái này, isAnonymous luôn false (mặc định), nên hiện avatar thật
    const avatarProps = renderAvatarProps(); 

    return (
      <Paper className="create-post-trigger-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
          
          <Avatar 
            {...avatarProps}
            onClick={() => navigate('/profile')} 
          />
           
          <Button
            fullWidth
            variant="outlined"
            className="fake-input-button"
            onClick={() => setIsExpanded(true)} 
          >
            Hãy đăng gì đó, {username}...
          </Button>

          <IconButton 
            color="success"
            onClick={() => {
              setTriggerUpload(true); 
              setIsExpanded(true);    
            }}
          >
            <ImageIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  // === RENDER TRẠNG THÁI ĐẦY ĐỦ (FORM EXPANDED) ===
  return (
    <Paper className="create-post-paper" elevation={0} variant="outlined">
      {/* Header */}
      <Box className="create-post-header">
        <Typography variant="h6" fontWeight="bold">Tạo bài viết</Typography>
        <IconButton onClick={handleCancel} sx={{ position: 'absolute', right: -4, top: -4 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
        
      {/* Thông tin người dùng */}
      <Box className="create-post-user-info">
        
        {/* Avatar thay đổi realtime khi toggle Switch Ẩn danh */}
        <Avatar {...renderAvatarProps()} />

        <Box ml={1.5}>
          <Typography fontWeight="bold">
            {isAnonymous ? "Bạn đang đăng ẩn danh" : username}
          </Typography>
          {!isAnonymous && (
             // Có thể hiển thị Role ở đây nếu muốn
             <Typography variant="caption" color="text.secondary" sx={{textTransform: 'capitalize'}}>
                {role === 'manager' ? 'Quản lý' : role === 'admin' ? 'Admin' : role === 'volunteer' ? 'Tình nguyện viên' : 'Thành viên'}
             </Typography>
          )}
        </Box>
      </Box>

      {/* Ô nhập nội dung */}
      <TextField
        variant="standard"
        fullWidth
        multiline 
        maxRows={10} 
        placeholder={isAnonymous ? "Chia sẻ ẩn danh..." : "Bạn đang nghĩ gì?"}
        InputProps={{ disableUnderline: true }}
        className="create-post-textfield"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        autoFocus 
      />

      {/* Hiển thị ảnh xem trước */}
      {imagePreview && (
        <Box sx={{ my: 2, position: 'relative' }}>
          <img src={imagePreview} alt="Xem trước" style={{ width: '100%', borderRadius: '8px' }} />
          <IconButton 
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Nút Ẩn danh */}
      <FormControlLabel
        control={
          <Switch
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
        }
        label="Đăng ẩn danh"
        className="create-post-anonymous"
      />

      {/* Thanh công cụ */}
      <Box className="create-post-toolbar">
        <Typography variant="body2" fontWeight="bold">Thêm ảnh vào bài viết</Typography>
        <Box>
          <IconButton color="success" onClick={() => fileInputRef.current.click()}>
            <ImageIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Nút Đăng */}
      <Button
        variant="contained"
        fullWidth
        disabled={!postContent || isLoading} 
        onClick={handleSubmit}
        sx={{
          backgroundColor: '#49BBBD',
          '&:hover': { backgroundColor: '#3c9a9a' },
        }}
      >
        {isLoading ? "Đang đăng..." : "Đăng"}
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        hidden
      />
    </Paper>
  );
}