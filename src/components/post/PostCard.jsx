import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper, Box, Avatar, Typography, IconButton, CardMedia, Button, Divider,
  List, ListItem, ListItemAvatar, ListItemText, CircularProgress,
  Modal, Backdrop, Fade, Dialog, DialogTitle, DialogContent, DialogActions,
  Menu, MenuItem, TextField, Stack,
} from "@mui/material";
import {
  MoreHoriz as MoreIcon,
  ThumbUpOutlined as LikeIcon,
  ChatBubbleOutlineOutlined as CommentIcon,
} from "@mui/icons-material";

import { getCommentsByPost } from "../../api/Comments";
import { likePost, getLikesByPost, deletePost, updatePost } from "../../api/Posts"; 
import CommentInput from "./CommentInput"; 
import "./Post.css";

export default function PostCard({ post, onPostDeleted, onPostUpdated, eventOwnerId }) {
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("userId"); 
  const currentUsername = localStorage.getItem("username");

  const [likes, setLikes] = useState(post.likes || []); 
  const isLiked = likes.includes(currentUserId);
  const likeCount = likes.length;

  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false); 
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [likeList, setLikeList] = useState([]); 
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [likeListOpen, setLikeListOpen] = useState(false);
  const [commentListOpen, setCommentListOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editedContent, setEditedContent] = useState(post.content); 

  // === LOGIC PHÂN QUYỀN ===
  const isPostOwner = (post.createdBy?._id === currentUserId) || (post.createdBy?.username === currentUsername);
  const isEventOwner = currentUserId === eventOwnerId;

  // Quyền: Post Owner được SỬA
  const canEdit = isPostOwner; 
  // Quyền: Post Owner HOẶC Event Owner được XÓA
  const canDelete = isPostOwner || isEventOwner; 
  // Chỉ hiện nút 3 chấm nếu có quyền
  const showMenuButton = (canEdit || canDelete) && !isEditing;

  // === XỬ LÝ AVATAR ===
  const getAvatarUrl = (user) => {
    if (!user || !user.avatar) return undefined;
    if (user.avatar.startsWith("http")) return user.avatar;
    const path = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `http://localhost:5000${path}`;
  };

  const getAvatarColor = (userRole) => {
    switch (userRole?.toLowerCase()) {
      case 'manager': return '#49BBBD'; 
      case 'admin': return '#d32f2f'; 
      case 'volunteer': return '#9e9e9e'; 
      default: return '#9c27b0'; 
    }
  };

  // --- HÀM NÀY ĐÃ ĐƯỢC SỬA ---
  const renderAvatarProps = (user, isAnonymousPost = false) => {
    // 1. Trường hợp ẩn danh
    if (isAnonymousPost) {
      return { src: undefined, children: '?', sx: { bgcolor: '#9e9e9e' } };
    }

    // 2. Trường hợp CÓ Avatar (Không null, không rỗng)
    if (user?.avatar && user.avatar !== "") {
      return { src: getAvatarUrl(user), children: null, sx: { bgcolor: 'transparent' } };
    }

    // 3. Trường hợp KHÔNG có avatar (null hoặc "") -> Logic fallback hiện tại
    return {
      src: undefined,
      children: user?.username?.charAt(0).toUpperCase() || 'U',
      sx: { bgcolor: getAvatarColor(user?.role) }
    };
  };
  // ---------------------------

  // === HANDLERS ===
  const fetchComments = async () => {
    if (isLoadingComments) return; 
    setIsLoadingComments(true);
    try { const data = await getCommentsByPost(post._id); setComments(data); } 
    catch (error) { console.error("Failed comments:", error); }
    setIsLoadingComments(false);
  };

  const handleToggleComments = () => {
    const newShow = !showComments; setShowComments(newShow);
    if (newShow && comments.length === 0) fetchComments();
  };
  
  const handleCommentPosted = (newComment) => {
    setComments([...comments, newComment]); setCommentCount(prev => prev + 1); 
  };

  const handleLike = async () => {
    if (!currentUserId) return alert("Cần đăng nhập");
    const newLikes = isLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId]; 
    setLikes(newLikes);
    try { await likePost(post._id, currentUsername); } 
    catch (error) { console.error("Lỗi like:", error); setLikes(post.likes); }
  };

  const handleImageClick = () => setLightboxOpen(true);
  const handleCloseLightbox = () => setLightboxOpen(false);
  
  const handleOpenLikeList = async () => {
    setLikeListOpen(true); setIsLoadingLikes(true);
    try { const data = await getLikesByPost(post._id); setLikeList(data); } 
    catch (error) { console.error("Lỗi like list:", error); }
    setIsLoadingLikes(false);
  };
  const handleCloseLikeList = () => setLikeListOpen(false);
  
  const handleOpenCommentList = () => { setCommentListOpen(true); fetchComments(); };
  const handleCloseCommentList = () => setCommentListOpen(false);
  
  const handleMenuOpen = (e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = async () => {
    handleMenuClose();
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      try {
        await deletePost(post._id, currentUsername);
        onPostDeleted(post._id); 
      } catch (error) {
        console.error("Lỗi xóa:", error); alert("Xóa thất bại.");
      }
    }
  };

  const handleEditClick = () => { handleMenuClose(); setIsEditing(true); };
  const handleCancelEdit = () => { setIsEditing(false); setEditedContent(post.content); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedPost = await updatePost(post._id, currentUsername, editedContent);
      onPostUpdated(updatedPost); setIsEditing(false); 
    } catch (error) { console.error("Lỗi update:", error); alert("Update thất bại."); }
  };

  const displayName = post.isAnonymous ? "Người dùng ẩn danh" : post.createdBy?.username;

  return (
    <> 
      <Paper className="post-card-paper" elevation={0} variant="outlined">
        
        <Box className="post-header">
          <Avatar {...renderAvatarProps(post.createdBy, post.isAnonymous)} />
          <Box ml={1.5}>
            <Typography variant="body1" component="div">
              <Box component="span" fontWeight="bold">
                {displayName}
              </Box>

              {post.event && (
                <>
                  <Box component="span" mx={0.5} color="text.secondary">
                    &rsaquo;
                  </Box>
                  <Box 
                    component="span" 
                    fontWeight="bold"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }} 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      navigate(`/event/${post.event._id}`);
                    }}
                  >
                    {post.event.title || post.event.name}
                  </Box>
                </>
              )}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {new Date(post.createdAt).toLocaleString('vi-VN')}
            </Typography>
          </Box>
          
          {showMenuButton && ( 
            <IconButton sx={{ ml: 'auto' }} onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          )}
        </Box>

        {isEditing ? (
          <Box component="form" onSubmit={handleUpdate} sx={{ my: 1 }}>
            <TextField fullWidth multiline variant="outlined" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} autoFocus />
            <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}>
              <Button onClick={handleCancelEdit} size="small">Hủy</Button>
              <Button type="submit" variant="contained" size="small">Lưu</Button>
            </Stack>
          </Box>
        ) : (
          <Typography variant="body1" className="post-content">{post.content}</Typography>
        )}

        {!isEditing && post.imageUrl && (
          <Box className="post-image-container">
            <CardMedia component="img" image={post.imageUrl} className="post-image" onClick={handleImageClick} sx={{ cursor: 'pointer' }} />
          </Box>
        )}

        {!isEditing && (
          <Box className="post-stats">
            <Typography variant="body2" color="text.secondary" onClick={handleOpenLikeList} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{likeCount} lượt thích</Typography>
            <Typography variant="body2" color="text.secondary" onClick={handleOpenCommentList} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{commentCount} bình luận</Typography>
          </Box>
        )}
        <Divider/>
        {!isEditing && (
          <Box className="post-actions">
            <Button startIcon={<LikeIcon />} onClick={handleLike} sx={{ color: isLiked ? '#49BBBD' : '#65676b', fontWeight: isLiked ? 'bold' : 'normal', flex: 1 }}>Thích</Button>
            <Button startIcon={<CommentIcon />} onClick={handleToggleComments} sx={{ color: showComments ? '#49BBBD' : '#65676b', fontWeight: showComments ? 'bold' : 'normal', flex: 1 }}>Bình luận</Button>
          </Box>
        )}

        {!isEditing && showComments && (
          <>
            <Divider />
            <Box className="post-comments" sx={{ pb: 2 }}>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: -2 }}>Bình luận gần đây</Typography>
              {isLoadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress size={24} /></Box>
              ) : comments.length === 0 ? (
                <Typography textAlign="center" sx={{ mt: 3, color: 'text.secondary', fontStyle: 'italic' }}>Chưa có bình luận nào</Typography>
              ) : ( 
                <List dense sx={{ mt: 3 }}>
                  {(() => {
                    const recentComment = comments[comments.length - 1]; 
                    const avatarProps = renderAvatarProps(recentComment.createdBy);
                    return (
                      <ListItem key={recentComment._id} sx={{ p: 0, alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                          <Avatar {...avatarProps} sx={{ ...avatarProps.sx, width: 32, height: 32 }} />
                        </ListItemAvatar>
                        <Box sx={{ bgcolor: '#f0f2f5', borderRadius: '16px', p: '8px 12px', width: '100%', ml: 0.5}}>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography component="span" variant="body2" fontWeight="bold" sx={{mt: -1}}>{recentComment.createdBy?.username}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{mt: -0.5}}>{new Date(recentComment.createdAt).toLocaleString('vi-VN')}</Typography>
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

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {canEdit && <MenuItem onClick={handleEditClick}>Chỉnh sửa</MenuItem>}
        {canDelete && <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Xóa</MenuItem>}
      </Menu>

      <Modal open={lightboxOpen} onClose={handleCloseLightbox} closeAfterTransition>
        <Fade in={lightboxOpen}>
          <Box onClick={handleCloseLightbox} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', outline: 'none' }}>
            <img src={post.imageUrl} alt="Post lightbox" style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} />
          </Box>
        </Fade>
      </Modal>

      <Dialog open={likeListOpen} onClose={handleCloseLikeList} fullWidth>
        <DialogTitle>Những người đã thích</DialogTitle>
        <DialogContent sx={{py: 0, px: 4}}>
          {isLoadingLikes ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : 
            <List>
              {likeList.map((user) => (
                <ListItem key={user._id}>
                  <ListItemAvatar>
                    <Avatar {...renderAvatarProps(user)} />
                  </ListItemAvatar>
                  <ListItemText primary={user.username} />
                </ListItem>
              ))}
              {likeList.length === 0 && <Typography textAlign="center">Chưa có ai thích.</Typography>}
            </List>
          }
        </DialogContent>
        <DialogActions><Button onClick={handleCloseLikeList}>Đóng</Button></DialogActions>
      </Dialog>
      
      <Dialog open={commentListOpen} onClose={handleCloseCommentList} fullWidth>
        <DialogTitle>Bình luận</DialogTitle>
        <DialogContent sx={{pb: 0}}>
          {isLoadingComments ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : 
            <List dense sx={{ pb: 0}}>
              {comments.map((comment) => {
                 const avatarProps = renderAvatarProps(comment.createdBy);
                 return (
                   <ListItem key={comment._id} sx={{ p: 0, alignItems: 'flex-start', mb: 1 }}>
                     <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                       <Avatar {...avatarProps} sx={{ ...avatarProps.sx, width: 32, height: 32 }} />
                     </ListItemAvatar>
                     <Box sx={{ bgcolor: '#f0f2f5', borderRadius: '16px', p: '8px 12px', width: '100%', ml: 0.5}}>
                       <ListItemText primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography component="span" variant="body2" fontWeight="bold" sx={{mt: -1}}>{comment.createdBy?.username}</Typography><Typography variant="caption" color="text.secondary" sx={{mt: -0.5}}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</Typography></Box>} secondary={comment.content} />
                     </Box>
                   </ListItem>
                 );
              })}
               {comments.length === 0 && <Typography textAlign="center">Chưa có bình luận nào.</Typography>}
            </List>
          }
        </DialogContent>
        <DialogActions><Button onClick={handleCloseCommentList}>Đóng</Button></DialogActions>
      </Dialog>
    </>
  );
}