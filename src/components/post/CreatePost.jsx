import { useState, useRef, useEffect } from "react";
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
  Close as CloseIcon, // Thêm icon Đóng
} from "@mui/icons-material";
import "./Post.css"; 

import { createPost } from "../../api/Posts"; 

export default function CreatePost({ eventId, onPostCreated }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Người dùng";
  
  // State chính: true = Form đầy đủ, false = Box đơn giản
  const [isExpanded, setIsExpanded] = useState(false); 
  
  // State cho nội dung
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State cho upload ảnh
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [triggerUpload, setTriggerUpload] = useState(false); // Dùng để kích hoạt upload
  const fileInputRef = useRef(null);

  // Hook để kích hoạt file input sau khi component expand
  useEffect(() => {
    if (isExpanded && triggerUpload) {
      fileInputRef.current.click();
      setTriggerUpload(false); // Reset trigger
    }
  }, [isExpanded, triggerUpload]);

  // Xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Hủy, quay về box đơn giản
  const handleCancel = () => {
    setIsExpanded(false);
    setPostContent("");
    setImageFile(null);
    setImagePreview(null);
    setIsAnonymous(false);
  };

  // Gửi bài đăng
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // (Tương lai: Bạn sẽ upload 'imageFile' lên server
      // và nhận về một 'imageUrl')
      
      const newPost = await createPost({
        content: postContent,
        isAnonymous,
        eventId,
        username,
        // (Tạm thời dùng ảnh preview, sau này dùng imageUrl thật)
        imageUrl: imagePreview, 
      });

      onPostCreated(newPost); // Gửi post lên EventGroup
      handleCancel(); // Reset form về trạng thái đơn giản
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Không thể tạo bài đăng, vui lòng thử lại.");
    }
    setIsLoading(false);
  };

  // === RENDER TRẠNG THÁI ĐƠN GIẢN ===
  // (Khi isExpanded = false)
  if (!isExpanded) {
    return (
      <Paper className="create-post-trigger-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
          <Avatar 
            sx={{ bgcolor: '#49BBBD', cursor: 'pointer' }} 
            onClick={() => navigate('/profile')} // (Chuyển đến trang profile sau)
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
          
          {/* Nút input giả */}
          <Button
            fullWidth
            variant="outlined"
            className="fake-input-button"
            onClick={() => setIsExpanded(true)} // Mở form đầy đủ
          >
            Hãy đăng gì đó, {username}...
          </Button>

          {/* Các nút icon */}
          <IconButton 
            color="success"
            onClick={() => {
              setTriggerUpload(true); // Đặt trigger
              setIsExpanded(true);    // Mở form
            }}
          >
            <ImageIcon />
          </IconButton>
          <IconButton color="primary" disabled>
            <TagIcon />
          </IconButton>
          <IconButton color="error" disabled>
            <LocationIcon />
          </IconButton>
        </Box>
      </Paper>
    );
  }

  // === RENDER TRẠNG THÁI ĐẦY ĐỦ (FORM) ===
  // (Khi isExpanded = true)
  return (
    <Paper className="create-post-paper" elevation={0} variant="outlined">
      {/* Header (Giống ảnh mockup 2) */}
      <Box className="create-post-header">
        <Typography variant="h6" fontWeight="bold">Tạo bài viết</Typography>
        <IconButton onClick={handleCancel} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      {/* Thông tin người dùng */}
      <Box className="create-post-user-info">
        <Avatar sx={{ bgcolor: '#49BBBD' }}> 
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <Box ml={1.5}>
          <Typography fontWeight="bold">
            {isAnonymous ? "Bạn đang đăng ẩn danh" : username}
          </Typography>
        </Box>
      </Box>

      {/* Ô nhập nội dung */}
      <TextField
        variant="standard"
        fullWidth
        multiline
        rows={4}
        placeholder="Bạn đang nghĩ gì?"
        InputProps={{ disableUnderline: true }}
        className="create-post-textfield"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        autoFocus // Tự động focus vào đây
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
        <Typography variant="body2" fontWeight="bold">Thêm vào bài viết</Typography>
        <Box>
          <IconButton color="success" onClick={() => fileInputRef.current.click()}>
            <ImageIcon />
          </IconButton>
          <IconButton color="primary" disabled><TagIcon /></IconButton>
          <IconButton color="error" disabled><LocationIcon /></IconButton>
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

      {/* Input ẩn để chọn file */}
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