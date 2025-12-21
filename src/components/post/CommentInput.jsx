import { useState } from "react";
import { Box, Avatar, TextField, IconButton } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { createComment } from "../../api/Comments";

/*
  Component: `CommentInput`

  Mô tả:
  - Form nhập nhanh để gửi bình luận cho một `postId` cụ thể.
  - Hàm chính: `handleSubmit` gửi comment lên API `createComment` và gọi `onCommentPosted` khi thành công.
  - Hiển thị avatar người dùng (nếu có) hoặc chữ cái đầu, màu theo `role`.
*/

export default function CommentInput({ postId, onCommentPosted }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Lấy thông tin từ LocalStorage
  const username = localStorage.getItem("username") || "User";
  const avatar = localStorage.getItem("avatar");
  const role = localStorage.getItem("role"); // <--- THÊM DÒNG NÀY

  // 2. Logic xác định màu nền (Giống HNavBar)
  const getRoleColor = () => {
    const currentRole = role ? role.toLowerCase() : "";
    switch (currentRole) {
      case "admin":
        return "#d32f2f"; // Đỏ
      case "manager":
        return "#49BBBD"; // Teal
      default:
        return "#9e9e9e"; // Xám
    }
  };

  // 3. Xử lý đường dẫn Avatar an toàn hơn (tránh chuỗi "null" hoặc "undefined")
  const getAvatarSrc = () => {
    if (avatar && avatar !== "null" && avatar !== "undefined" && avatar !== "") {
      return `http://localhost:5000${avatar}`;
    }
    return undefined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const newComment = await createComment({
        content,
        username,
        postId,
      });

      onCommentPosted(newComment);
      setContent("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
    setIsLoading(false);
  };

  const avatarSrc = getAvatarSrc();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", alignItems: "center", mt: 2 }}
    >
      {/* 4. Áp dụng màu nền vào Avatar */}
      <Avatar
        src={avatarSrc}
        sx={{
          width: 32,
          height: 32,
          mr: 1.5,
          // Nếu có ảnh -> nền trong suốt. Nếu không -> lấy màu theo role
          bgcolor: avatarSrc ? "transparent" : getRoleColor(),
        }}
      >
        {/* Nếu không có ảnh thì hiện chữ cái đầu */}
        {!avatarSrc && username.charAt(0).toUpperCase()}
      </Avatar>

      <TextField
        variant="outlined"
        fullWidth
        placeholder="Viết bình luận..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
        size="small"
        sx={{
          borderRadius: "20px",
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
            backgroundColor: "#f0f2f5",
            "& fieldset": { border: "none" },
          },
        }}
        InputProps={{
          endAdornment: (
            <IconButton
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{ color: "#49BBBD" }}
            >
              <SendIcon />
            </IconButton>
          ),
        }}
      />
    </Box>
  );
}