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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop, // Giữ lại Backdrop
  Fade, // Giữ lại Fade
} from "@mui/material";
import {
  MoreHoriz as MoreIcon,
  ThumbUpOutlined as LikeIcon,
  ChatBubbleOutlineOutlined as CommentIcon,
} from "@mui/icons-material";

// Import API
import { getCommentsByPost } from "../../api/Comments";
import { likePost, getLikesByPost } from "../../api/Posts"; 
import CommentInput from "./CommentInput"; 
import "./Post.css";

export default function PostCard({ post }) {
  const currentUserId = localStorage.getItem("userId"); 
  const currentUsername = localStorage.getItem("username");

  // State cho Like (Lấy từ API)
  const [likes, setLikes] = useState(post.likes || []); 
  const isLiked = likes.includes(currentUserId);
  const likeCount = likes.length;

  // State cho bình luận
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false); // Bật/tắt ô nhập
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  // State cho Lightbox (xem ảnh)
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // State cho Dialog (danh sách like)
  const [likeList, setLikeList] = useState([]); 
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [likeListOpen, setLikeListOpen] = useState(false);

  // State cho Dialog (danh sách bình luận)
  const [commentListOpen, setCommentListOpen] = useState(false);

  // Hàm tải bình luận
  const fetchComments = async () => {
    if (isLoadingComments) return; 
    setIsLoadingComments(true);
    try {
      // API của bạn đang sắp xếp ASC (cũ nhất trước)
      const data = await getCommentsByPost(post._id);
      setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
    setIsLoadingComments(false);
  };

  // Xử lý khi bấm nút "Bình luận"
  const handleToggleComments = () => {
    const newShowState = !showComments;
    setShowComments(newShowState);
    if (newShowState && comments.length === 0) {
      fetchComments(); 
    }
  };
  
  // Callback khi bình luận mới được tạo
  const handleCommentPosted = (newComment) => {
    setComments([...comments, newComment]); // Thêm vào cuối mảng
    setCommentCount(prevCount => prevCount + 1); 
  };

  // Hàm Like (Gọi API)
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

  // Hàm cho Lightbox (xem ảnh)
  const handleImageClick = () => setLightboxOpen(true);
  const handleCloseLightbox = () => setLightboxOpen(false);

  // Hàm cho Dialog (danh sách like)
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

  // Hàm cho Dialog (danh sách bình luận)
  const handleOpenCommentList = () => {
    setCommentListOpen(true);
    if (comments.length === 0) {
      fetchComments();
    }
  };
  const handleCloseCommentList = () => setCommentListOpen(false);

  const userInitial = post.createdBy?.username?.charAt(0).toUpperCase() || 'A';
  const displayName = post.isAnonymous ? "Người dùng ẩn danh" : post.createdBy?.username;

  return (
    <> 
      <Paper className="post-card-paper" elevation={0} variant="outlined">
        {/* Header */}
        <Box className="post-header">
          <Avatar sx={{ bgcolor: '#49BBBD' }}> 
            {post.isAnonymous ? '?' : userInitial}
          </Avatar>
          <Box ml={1.5}>
            <Typography fontWeight="bold">{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(post.createdAt).toLocaleString('vi-VN')}
            </Typography>
          </Box>
          <IconButton sx={{ ml: 'auto' }}>
            <MoreIcon />
          </IconButton>
        </Box>

        {/* Nội dung (Caption) */}
        <Typography variant="body1" className="post-content">
          {post.content}
        </Typography>

        {/* Ảnh (Nếu có) */}
        {post.imageUrl && (
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

        {/* Thống kê (Like, Comment) */}
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

        <Divider/>

        {/* Nút (Like, Comment) */}
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

        {/* === SỬA LẠI KHỐI NÀY THEO YÊU CẦU CỦA BẠN === */}
        {/* Hiển thị khu vực bình luận inline */}
        {showComments && (
          <>
            <Divider />
            <Box className="post-comments" sx={{ pb: 2 }}>
              
              {/* 1. Đổi tiêu đề */}
              <Typography variant="body2" fontWeight="bold" sx={{ mb: -2 }}>
                Bình luận gần đây
              </Typography>

              {/* Hiển thị loading hoặc danh sách bình luận */}
              {isLoadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense sx={{ mt: 3 }}>
                  
                  {/* 2. Logic chỉ hiển thị bình luận gần nhất */}
                  {comments.length > 0 && 
                    (() => {
                      // API của bạn trả về sort ASC (cũ nhất trước)
                      // nên bình luận gần nhất là cái cuối cùng.
                      const recentComment = comments[comments.length - 1]; 
                      
                      return (
                        <ListItem key={recentComment._id} sx={{ p: 0, alignItems: 'flex-start' }}>
                          <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {recentComment.createdBy?.username?.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ bgcolor: '#f0f2f5', borderRadius: '16px', p: '8px 12px', width: '100%', ml: 0.5}}>
                            <ListItemText 
                              primary={
                                // Thêm Timestamp
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
                    })() // IIFE (Immediately Invoked Function Expression)
                  }
                  
                </List>
              )}

              {/* Component nhập bình luận */}
              <CommentInput postId={post._id} onCommentPosted={handleCommentPosted} />
            </Box>
          </>
        )}
      </Paper>

      {/* Modal (Lightbox) xem ảnh (SỬA LẠI THEO CODE GỐC) */}
      <Modal
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0,0,0,0.5)' } // Nền mờ 50%
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
                    <Avatar sx={{ bgcolor: '#49BBBD' }}>
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
        <DialogContent>
          {isLoadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List dense>
              {comments.map((comment) => (
                 <ListItem key={comment._id} sx={{ p: 0, alignItems: 'flex-start', mb: 1 }}>
                   <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                     <Avatar sx={{ width: 32, height: 32 }}>
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