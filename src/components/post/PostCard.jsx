import { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  CardMedia,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Modal, 
  Backdrop, 
  Fade, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // 1. Imports mới
  Menu,
  MenuItem,
  TextField,
  Stack,
} from "@mui/material";
import {
  MoreHoriz as MoreIcon,
  ThumbUpOutlined as LikeIcon,
  ChatBubbleOutlineOutlined as CommentIcon,
} from "@mui/icons-material";

// Import API
import { getCommentsByPost } from "../../api/Comments";
// 2. Import API mới
import { likePost, getLikesByPost, deletePost, updatePost } from "../../api/Posts"; 
import CommentInput from "./CommentInput"; 
import "./Post.css";

// 3. Thêm props mới
export default function PostCard({ post, onPostDeleted, onPostUpdated }) {
  const currentUserId = localStorage.getItem("userId"); 
  const currentUsername = localStorage.getItem("username");
  const role = localStorage.getItem("role"); // Lấy role

  // State cho Like
  const [likes, setLikes] = useState(post.likes || []); 
  const isLiked = likes.includes(currentUserId);
  const likeCount = likes.length;

  // State cho bình luận
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false); 
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  // State cho Lightbox (xem ảnh)
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // State cho Dialog (danh sách like)
  const [likeList, setLikeList] = useState([]); 
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [likeListOpen, setLikeListOpen] = useState(false);

  // State cho Dialog (danh sách bình luận)
  const [commentListOpen, setCommentListOpen] = useState(false);

  // === 4. THÊM STATE MỚI (CHỈNH SỬA & MENU) ===
  const [anchorEl, setAnchorEl] = useState(null); // State cho menu 3 chấm
  const [isEditing, setIsEditing] = useState(false); // State bật/tắt chế độ sửa
  const [editedContent, setEditedContent] = useState(post.content); // Nội dung trong form sửa

  // 5. Kiểm tra quyền
  const isOwner = post.createdBy?.username === currentUsername;
  const isManager = role === 'manager';
  const canEditOrDelete = isOwner || isManager;

  // ... (Các hàm fetchComments, handleToggleComments, handleCommentPosted, handleLike) ...
  const fetchComments = async () => {
    if (isLoadingComments) return; 
    setIsLoadingComments(true);
    try {
      const data = await getCommentsByPost(post._id);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
    setIsLoadingComments(false);
  };

  const handleToggleComments = () => {
    const newShowState = !showComments;
    setShowComments(newShowState);
    if (newShowState && comments.length === 0) {
      fetchComments();
    }
  };
  
  const handleCommentPosted = (newComment) => {
    setComments([...comments, newComment]); 
    setCommentCount(prevCount => prevCount + 1); 
  };

  const handleLike = async () => {
    if (!currentUserId || !currentUsername) {
      alert("Bạn cần đăng nhập để thích bài viết.");
      return;
    }
    const newLikes = isLiked 
      ? likes.filter(id => id !== currentUserId) 
      : [...likes, currentUserId]; 
    setLikes(newLikes);
    try {
      await likePost(post._id, currentUsername);
    } catch (error) {
      console.error("Lỗi khi like:", error);
      setLikes(post.likes); 
    }
  };

  // ... (Các hàm Lightbox, Dialog Like, Dialog Comment) ...
  const handleImageClick = () => setLightboxOpen(true);
  const handleCloseLightbox = () => setLightboxOpen(false);
  const handleOpenLikeList = async () => {
    setLikeListOpen(true);
    if (likeList.length === 0 && likeCount > 0) {
      setIsLoadingLikes(true);
      try {
        const data = await getLikesByPost(post._id);
        setLikeList(data); 
      } catch (error) {
        console.error("Lỗi khi tải danh sách like:", error);
      }
      setIsLoadingLikes(false);
    }
  };
  const handleCloseLikeList = () => setLikeListOpen(false);
  const handleOpenCommentList = () => {
    setCommentListOpen(true);
    if (comments.length === 0) {
      fetchComments();
    }
  };
  const handleCloseCommentList = () => setCommentListOpen(false);

  // === 6. THÊM CÁC HÀM MỚI (MENU, EDIT, DELETE) ===
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Xử lý Xóa
  const handleDelete = async () => {
    handleMenuClose();
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      try {
        await deletePost(post._id, currentUsername);
        onPostDeleted(post._id); // Báo cho EventGroup.jsx xóa bài
      } catch (error) {
        console.error("Lỗi khi xóa bài đăng:", error);
        alert("Xóa bài đăng thất bại.");
      }
    }
  };

  // Bật chế độ sửa
  const handleEditClick = () => {
    handleMenuClose();
    setIsEditing(true);
  };

  // Hủy sửa
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content); // Reset nội dung
  };

  // Gửi nội dung đã sửa
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Gửi nội dung mới
      const updatedPost = await updatePost(post._id, currentUsername, editedContent);
      onPostUpdated(updatedPost); // Báo cho EventGroup.jsx cập nhật
      setIsEditing(false); // Tắt chế độ sửa
    } catch (error) {
      console.error("Lỗi khi cập nhật bài đăng:", error);
      alert("Cập nhật thất bại.");
    }
  };
  // =============================================

  const userInitial = post.createdBy?.username?.charAt(0).toUpperCase() || 'A';
  const displayName = post.isAnonymous ? "Người dùng ẩn danh" : post.createdBy?.username;

  return (
    <> 
      <Paper className="post-card-paper" elevation={0} variant="outlined">
        
        {/* Header */}
        <Box className="post-header">
          <Avatar
            sx={{ bgcolor: '#49BBBD' }}
            src={
              !post.isAnonymous && post.createdBy?.avatar
                ? `http://localhost:5000${post.createdBy.avatar}`
                : undefined
            }
          >
            {post.isAnonymous ? '?' : userInitial}
          </Avatar>

          <Box ml={1.5}>
            <Typography fontWeight="bold">{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.createdAt).toLocaleString('vi-VN')}
            </Typography>
          </Box>
          
          {/* 7. Sửa Icon 3 chấm (Chỉ hiển thị nếu có quyền) */}
          {canEditOrDelete && !isEditing && ( // Ẩn khi đang sửa
            <IconButton sx={{ ml: 'auto' }} onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          )}
        </Box>

        {/* === 8. SỬA KHỐI NÀY (NỘI DUNG) === */}
        {isEditing ? (
          // Chế độ CHỈNH SỬA
          <Box component="form" onSubmit={handleUpdate} sx={{ my: 1 }}>
            <TextField
              fullWidth
              multiline
              variant="outlined"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancelEdit} size="small">Hủy</Button>
              <Button type="submit" variant="contained" size="small">Lưu</Button>
            </Stack>
          </Box>
        ) : (
          // Chế độ XEM
          <Typography variant="body1" className="post-content">
            {post.content}
          </Typography>
        )}
        {/* ================================== */}


        {/* Ảnh (Nếu có) (Ẩn khi đang sửa) */}
        {!isEditing && post.imageUrl && (
          <Box className="post-image-container">
            <CardMedia
              component="img"
              image={post.imageUrl}
              alt="Post image"
              className="post-image"
              onClick={handleImageClick}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}

        {/* Thống kê (Like, Comment) (Ẩn khi đang sửa) */}
        {!isEditing && (
          <Box className="post-stats">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              onClick={handleOpenLikeList}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {likeCount} lượt thích
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              onClick={handleOpenCommentList} 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {commentCount} bình luận 
            </Typography>
          </Box>
        )}
        
        <Divider/>

        {/* Nút (Like, Comment) (Ẩn khi đang sửa) */}
        {!isEditing && (
          <Box className="post-actions">
            <Button 
              startIcon={<LikeIcon />} 
              onClick={handleLike}
              sx={{
                color: isLiked ? '#49BBBD' : '#65676b',
                fontWeight: isLiked ? 'bold' : 'normal',
                flex: 1 
              }}
            >
              Thích
            </Button>
            <Button 
              startIcon={<CommentIcon />} 
              onClick={handleToggleComments} 
              sx={{
                color: showComments ? '#49BBBD' : '#65676b',
                fontWeight: showComments ? 'bold' : 'normal',
                flex: 1 
              }}
            >
              Bình luận
            </Button>
          </Box>
        )}

        {/* Khu vực bình luận (Ẩn khi đang sửa) */}
        {!isEditing && showComments && (
          <>
            <Divider />
            <Box className="post-comments" sx={{ pb: 2 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: -2 }}>
                Bình luận gần đây
              </Typography>

              {isLoadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : comments.length === 0 ? (
                <Typography textAlign="center" sx={{ mt: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                  Bài đăng này chưa có bình luận nào
                </Typography>
              ) : ( 
                <List dense sx={{ mt: 3 }}>
                  {(() => {
                    const recentComment = comments[comments.length - 1]; 
                    return (
                      <ListItem key={recentComment._id} sx={{ p: 0, alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                          <Avatar
                            sx={{ width: 32, height: 32 }}
                            src={
                              recentComment.createdBy?.avatar
                                ? `http://localhost:5000${recentComment.createdBy.avatar}`
                                : undefined
                            }
                          >
                            {recentComment.createdBy?.username?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>

                        </ListItemAvatar>
                        <Box sx={{ bgcolor: '#f0f2f5', borderRadius: '16px', p: '8px 12px', width: '100%', ml: 0.5}}>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography component="span" variant="body2" fontWeight="bold" sx={{mt: -1}}>
                                  {recentComment.createdBy?.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{mt: -0.5}}>
                                  {new Date(recentComment.createdAt).toLocaleString('vi-VN')}
                                </Typography>
                              </Box>
                            }
                            secondary={recentComment.content}
                          />
                        </Box>
                      </ListItem>
                    );
                  })()}
                </List>
              )}

              <CommentInput postId={post._id} onCommentPosted={handleCommentPosted} />
            </Box>
          </>
        )}
      </Paper> 

      {/* === 9. THÊM MENU VÀO ĐÂY === */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEditClick}>Chỉnh sửa</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Xóa</MenuItem>
      </Menu>

      {/* Modal (Lightbox) xem ảnh */}
      <Modal
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0,0,0,0.5)' } 
        }}
      >
        <Fade in={lightboxOpen}>
          <Box 
            onClick={handleCloseLightbox} 
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              width: '100vw',
              outline: 'none',
            }}
          >
            <img 
              src={post.imageUrl} 
              alt="Post lightbox" 
              style={{ 
                maxHeight: '90vh', 
                maxWidth: '90vw', 
                objectFit: 'contain' 
              }} 
            />
          </Box>
        </Fade>
      </Modal>

      {/* Dialog (danh sách like) */}
      <Dialog open={likeListOpen} onClose={handleCloseLikeList} fullWidth>
        <DialogTitle>Những người đã thích</DialogTitle>
        <DialogContent sx={{py: 0, px: 4}}>
          {isLoadingLikes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {likeList.map((user) => (
                <ListItem key={user._id}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: '#49BBBD' }}
                      src={
                        user.avatar
                          ? `http://localhost:5000${user.avatar}`
                          : undefined
                      }
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} />
                </ListItem>
              ))}
              {likeList.length === 0 && (
                <Typography textAlign="center">Chưa có ai thích bài viết này.</Typography>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLikeList}>Đóng</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog (danh sách bình luận) */}
      <Dialog open={commentListOpen} onClose={handleCloseCommentList} fullWidth>
        <DialogTitle>Bình luận</DialogTitle>
        <DialogContent sx={{pb: 0}}>
          {isLoadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List dense sx={{ pb: 0}}>
              {comments.map((comment) => (
                 <ListItem key={comment._id} sx={{ p: 0, alignItems: 'flex-start', mb: 1 }}>
                   <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                    <Avatar
                      sx={{ width: 32, height: 32 }}
                      src={
                        comment.createdBy?.avatar
                          ? `http://localhost:5000${comment.createdBy.avatar}`
                          : undefined
                      }
                    >
                      {comment.createdBy?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                   </ListItemAvatar>
                   <Box sx={{ bgcolor: '#f0f2f5', borderRadius: '16px', p: '8px 12px', width: '100%', ml: 0.5}}>
                     <ListItemText 
                       primary={
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography component="span" variant="body2" fontWeight="bold" sx={{mt: -1}}>
                             {comment.createdBy?.username}
                           </Typography>
                           <Typography variant="caption" color="text.secondary" sx={{mt: -0.5}}>
                             {new Date(comment.createdAt).toLocaleString('vi-VN')}
                           </Typography>
                         </Box>
                       }
                       secondary={comment.content}
                     />
                   </Box>
                 </ListItem>
              ))}
               {comments.length === 0 && (
                <Typography textAlign="center">Chưa có bình luận nào.</Typography>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentList}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}