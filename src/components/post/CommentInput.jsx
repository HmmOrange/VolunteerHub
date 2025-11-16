import { useState } from "react";
import { Box, Avatar, TextField, Button, IconButton } from "@mui/material";
import { Send as SendIcon, PhotoCamera } from "@mui/icons-material";
import { createComment } from "../../api/Comments";

export default function CommentInput({ postId, onCommentPosted }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const username = localStorage.getItem("username") || "User";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return; // Không gửi nếu trống

    setIsLoading(true);
    try {
      const newComment = await createComment({
        content,
        username,
        postId,
      });
      onCommentPosted(newComment); // Gửi bình luận mới lên PostCard
      setContent(""); // Xóa input
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
    setIsLoading(false);
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
    >
      <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#49BBBD' }}>
        {username.charAt(0).toUpperCase()}
      </Avatar>
      
      {/* Input nhập bình luận (Mô phỏng ảnh) */}
      <TextField
        variant="outlined"
        fullWidth
        placeholder="Viết bình luận..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
        size="small"
        sx={{
          borderRadius: '20px',
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            backgroundColor: '#f0f2f5',
            '& fieldset': {
              border: 'none',
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <IconButton onClick={handleSubmit} disabled={isLoading} sx={{color: '#49BBBD'}}>
              <SendIcon />
            </IconButton>
          )
        }}
      />
    </Box>
  );
}