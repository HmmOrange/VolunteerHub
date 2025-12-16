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
  Close as CloseIcon, 
} from "@mui/icons-material";
import "./Post.css"; 

// 1. Import cả 2 API
import { createPost, uploadImage } from "../../api/Posts"; 

export default function CreatePost({ eventId, onPostCreated }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Người dùng";
  
  const [isExpanded, setIsExpanded] = useState(false); 
  
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State: imageFile (File thật), imagePreview (link blob:)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [triggerUpload, setTriggerUpload] = useState(false); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isExpanded && triggerUpload) {
      fileInputRef.current.click();
      setTriggerUpload(false); 
    }
  }, [isExpanded, triggerUpload]);

  // Xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file); // Lưu file thật vào state
      setImagePreview(URL.createObjectURL(file)); // Tạo link blob: để xem trước
    }
  };

  // Hủy, quay về box đơn giản
  const handleCancel = () => {
    setIsExpanded(false);
    setPostContent("");
    setImageFile(null); // Xóa file
    setImagePreview(null); // Xóa link xem trước
    setIsAnonymous(false);
  };

  // Gửi bài đăng
  const handleSubmit = async () => {
    // Kiểm tra xem eventId đã có chưa
    if (!eventId) {
      alert("Đang tải dữ liệu sự kiện, vui lòng thử lại sau giây lát.");
      return;
    }
    
    setIsLoading(true);
    let finalImageUrl = null; // URL ảnh sẽ lưu vào CSDL

    try {
      // 1. Kiểm tra xem có file ảnh không
      if (imageFile) {
        // 2. Nếu có, tạo FormData
        const formData = new FormData();
        formData.append('image', imageFile); // 'image' phải khớp với tên ở route

        // 3. Gọi API upload
        const uploadRes = await uploadImage(formData);
        finalImageUrl = uploadRes.imageUrl; // Lấy URL thật
      }

      // 4. Gọi API createPost với URL thật (hoặc null)
      const newPost = await createPost({
        content: postContent,
        isAnonymous,
        eventId,
        username,
        imageUrl: finalImageUrl, // Gửi URL thật về CSDL
      });

      onPostCreated(newPost); // Gửi post lên EventGroup
      handleCancel(); // Reset form

    } catch (error) {
      console.error("Không thể tạo bài đăng:", error);
      alert("Không thể tạo bài đăng, vui lòng thử lại.");
    }
    
    setIsLoading(false);
  };
  
  // === RENDER TRẠNG THÁI ĐƠN GIẢN ===
  if (!isExpanded) {
    return (
      <Paper className="create-post-trigger-paper" elevation={0} variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
          <Avatar 
            sx={{ bgcolor: '#49BBBD', cursor: 'pointer' }} 
            onClick={() => navigate('/profile')} 
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
          
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
        <Avatar sx={{ bgcolor: '#49BBBD' }}> 
          {username.charAt(0).toUpperCase()}
        </Avatar>
        <Box ml={1.5}>
          <Typography fontWeight="bold">
            {isAnonymous ? "Bạn đang đăng ẩn danh" : username}
          </Typography>
        </Box>
      </Box>

      {/* === SỬA TẠI ĐÂY === */}
      {/* Ô nhập nội dung */}
      <TextField
        variant="standard"
        fullWidth
        multiline // Giữ lại: cho phép nhiều dòng
        // Xóa: rows={4} (vì đây là cố định)
        maxRows={10} // Thêm: Giới hạn chiều cao (ví dụ 10 dòng)
                     // TextField sẽ tự động giãn nở đến 10 dòng
                     // sau đó mới hiện thanh cuộn
        placeholder="Bạn đang nghĩ gì?"
        InputProps={{ disableUnderline: true }}
        className="create-post-textfield"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        autoFocus 
      />
      {/* ================= */}


      {/* Hiển thị ảnh xem trước (dùng link blob:) */}
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