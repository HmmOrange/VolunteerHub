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

import { createPost, uploadImage } from "../../api/Posts";

export default function CreatePost({ eventId, onPostCreated }) {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Người dùng";
  const avatar = localStorage.getItem("avatar"); // ✅ FIX

  const [isExpanded, setIsExpanded] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleImageChange = (e) => {
    if (e.target.files?.[0]) {
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
      alert("Đang tải dữ liệu sự kiện, vui lòng thử lại.");
      return;
    }

    setIsLoading(true);
    let finalImageUrl = null;

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
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
    } catch (err) {
      console.error("Không thể tạo bài đăng:", err);
      alert("Không thể tạo bài đăng, vui lòng thử lại.");
    }

    setIsLoading(false);
  };

  /* ================= SIMPLE STATE ================= */
  if (!isExpanded) {
    return (
      <Paper className="create-post-trigger-paper" elevation={0} variant="outlined">
        <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
          <Avatar
            sx={{ cursor: "pointer" }}
            src={avatar ? `http://localhost:5000${avatar}` : undefined}
            onClick={() => navigate("/profile")}
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

          <IconButton disabled><TagIcon /></IconButton>
          <IconButton disabled><LocationIcon /></IconButton>
        </Box>
      </Paper>
    );
  }

  /* ================= EXPANDED FORM ================= */
  return (
    <Paper className="create-post-paper" elevation={0} variant="outlined">
      <Box className="create-post-header">
        <Typography variant="h6" fontWeight="bold">
          Tạo bài viết
        </Typography>
        <IconButton onClick={handleCancel}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box className="create-post-user-info">
        <Avatar
          src={avatar ? `http://localhost:5000${avatar}` : undefined}
        >
          {username.charAt(0).toUpperCase()}
        </Avatar>

        <Box ml={1.5}>
          <Typography fontWeight="bold">
            {isAnonymous ? "Bạn đang đăng ẩn danh" : username}
          </Typography>
        </Box>
      </Box>

      <TextField
        variant="standard"
        fullWidth
        multiline
        maxRows={10}
        placeholder="Bạn đang nghĩ gì?"
        InputProps={{ disableUnderline: true }}
        className="create-post-textfield"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        autoFocus
      />

      {imagePreview && (
        <Box sx={{ my: 2, position: "relative" }}>
          <img
            src={imagePreview}
            alt="Xem trước"
            style={{ width: "100%", borderRadius: 8 }}
          />
          <IconButton
            onClick={() => {
              setImageFile(null);
              setImagePreview(null);
            }}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
        }
        label="Đăng ẩn danh"
      />

      <Box className="create-post-toolbar">
        <Typography variant="body2" fontWeight="bold">
          Thêm vào bài viết
        </Typography>
        <Box>
          <IconButton onClick={() => fileInputRef.current.click()}>
            <ImageIcon />
          </IconButton>
          <IconButton disabled><TagIcon /></IconButton>
          <IconButton disabled><LocationIcon /></IconButton>
        </Box>
      </Box>

      <Button
        variant="contained"
        fullWidth
        disabled={!postContent || isLoading}
        onClick={handleSubmit}
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
