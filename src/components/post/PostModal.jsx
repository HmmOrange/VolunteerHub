import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, Box, Avatar, Typography, IconButton, CardMedia, Button, Divider,
  List, ListItem, ListItemAvatar, ListItemText, CircularProgress,
  Menu, MenuItem, TextField, Stack, Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreHoriz as MoreIcon,
  ThumbUpOutlined as LikeIcon,
  ThumbUp as LikeFilledIcon,
} from "@mui/icons-material";

import { getCommentsByPost } from "../../api/Comments";
import { likePost, deletePost, updatePost } from "../../api/Posts"; 
import CommentInput from "./CommentInput"; 
import "./Post.css";

export default function PostModal({ open, onClose, post, onPostDeleted, onPostUpdated, eventOwnerId }) {
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("userId"); 
  const currentUsername = localStorage.getItem("username");
  const { showToast } = useToast();

  const [likes, setLikes] = useState(post?.likes || []); 
  const isLiked = likes.includes(currentUserId);
  const likeCount = likes.length;

  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);

  const [anchorEl, setAnchorEl] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editedContent, setEditedContent] = useState(post?.content || ""); 

  // === LOGIC PHÂN QUYỀN ===
  const isPostOwner = (post?.createdBy?._id === currentUserId) || (post?.createdBy?.username === currentUsername);
  const isEventOwner = currentUserId === eventOwnerId;

  const canEdit = isPostOwner; 
  const canDelete = isPostOwner || isEventOwner; 
  const showMenuButton = (canEdit || canDelete) && !isEditing;

  // === XỬ LÝ AVATAR ===
  const getAvatarUrl = (user) => {
    if (!user || !user.avatar) return undefined;
    if (user.avatar.startsWith("http")) return user.avatar;
    const path = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `http://localhost:5000${path}`;
  };

  // === XỬ LÝ IMAGE URL ===
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("data:")) return imageUrl;
    const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
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

  const renderAvatarProps = (user, isAnonymousPost = false) => {
    if (isAnonymousPost) {
      return { src: undefined, children: '?', sx: { bgcolor: '#9e9e9e' } };
    }

    if (user?.avatar && user.avatar !== "") {
      return { src: getAvatarUrl(user), children: null, sx: { bgcolor: 'transparent' } };
    }

    return {
      src: undefined,
      children: user?.username?.charAt(0).toUpperCase() || 'U',
      sx: { bgcolor: getAvatarColor(user?.role) }
    };
  };

  // === FETCH COMMENTS ===
  useEffect(() => {
    const fetchComments = async () => {
      if (!post?._id || !open) return; 
      setIsLoadingComments(true);
      try { 
        const data = await getCommentsByPost(post._id); 
        setComments(data); 
      } 
      catch (error) { console.error("Failed comments:", error); }
      setIsLoadingComments(false);
    };

    if (open && post?._id) {
      fetchComments();
      setLikes(post.likes || []);
      setCommentCount(post.commentCount || 0);
      setEditedContent(post.content || "");
    }
  }, [open, post]);

  const handleCommentPosted = (newComment) => {
    setComments([...comments, newComment]); 
    setCommentCount(prev => prev + 1); 
  };

  const handleLike = async () => {
    if (!currentUserId) { showToast("Cần đăng nhập", 'warning'); return; }
    const newLikes = isLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId]; 
    setLikes(newLikes);
    try { await likePost(post._id, currentUsername); } 
    catch (error) { console.error("Lỗi like:", error); setLikes(post.likes); }
  };
  
  const handleMenuOpen = (e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = async () => {
    handleMenuClose();
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      try {
        await deletePost(post._id, currentUsername);
        onPostDeleted(post._id); 
        onClose();
      } catch (error) {
        console.error("Lỗi xóa:", error); 
        showToast("Xóa thất bại.", 'error');
      }
    }
  };

  const handleEditClick = () => { handleMenuClose(); setIsEditing(true); };
  const handleCancelEdit = () => { setIsEditing(false); setEditedContent(post.content); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedPost = await updatePost(post._id, currentUsername, editedContent);
      onPostUpdated(updatedPost); 
      setIsEditing(false); 
    } catch (error) { 
      console.error("Lỗi update:", error); 
      showToast("Update thất bại.", 'error'); 
    }
  };

  const displayName = post?.isAnonymous ? "Người dùng ẩn danh" : post?.createdBy?.username;

  if (!post) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        {/* Header với nút đóng */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: '1px solid #e0e0e0' 
        }}>
          <Typography variant="h6" fontWeight="bold">
            Bài viết của {displayName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left side - Image */}
          {post.imageUrl && (
            <Box sx={{ 
              flex: 1, 
              bgcolor: '#000', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: { xs: 300, md: 500 },
              maxHeight: { xs: 400, md: 'none' }
            }}>
              <CardMedia 
                component="img" 
                image={getImageUrl(post.imageUrl)} 
                sx={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }} 
              />
            </Box>
          )}

          {/* Right side - Content & Comments */}
          <Box sx={{ 
            width: { xs: '100%', md: post.imageUrl ? 400 : '100%' }, 
            display: 'flex', 
            flexDirection: 'column',
            maxHeight: { xs: 'auto', md: '70vh' }
          }}>
            {/* Post Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar {...renderAvatarProps(post.createdBy, post.isAnonymous)} />
                <Box ml={1.5} sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {displayName}
                  </Typography>
                  {post.event && (
                    <Typography 
                      variant="body2" 
                      color="primary"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }} 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/event/${post.event._id}`);
                        onClose();
                      }}
                    >
                      › {post.event.title || post.event.name}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
                
                {showMenuButton && ( 
                  <IconButton onClick={handleMenuOpen} size="small">
                    <MoreIcon />
                  </IconButton>
                )}
              </Box>

              {/* Post Content */}
              {isEditing ? (
                <Box component="form" onSubmit={handleUpdate} sx={{ mt: 2 }}>
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
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </Typography>
              )}
            </Box>

            {/* Stats & Actions */}
            <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {likeCount} lượt thích
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {commentCount} bình luận
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', pt: 1 }}>
                <Button 
                  startIcon={isLiked ? <LikeFilledIcon /> : <LikeIcon />} 
                  onClick={handleLike} 
                  sx={{ 
                    color: isLiked ? '#49BBBD' : '#65676b', 
                    fontWeight: isLiked ? 'bold' : 'normal', 
                    flex: 1 
                  }}
                >
                  Thích
                </Button>
              </Box>
            </Box>

            {/* Comments Section - Scrollable */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              px: 2, 
              py: 2,
              minHeight: 200
            }}>
              {isLoadingComments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : comments.length === 0 ? (
                <Typography 
                  textAlign="center" 
                  sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}
                >
                  Chưa có bình luận nào
                </Typography>
              ) : ( 
                <List dense sx={{ pb: 0 }}>
                  {comments.map((comment) => {
                    const avatarProps = renderAvatarProps(comment.createdBy);
                    return (
                      <ListItem key={comment._id} sx={{ px: 0, alignItems: 'flex-start', mb: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 40, mt: 0.5 }}>
                          <Avatar {...avatarProps} sx={{ ...avatarProps.sx, width: 32, height: 32 }} />
                        </ListItemAvatar>
                        <Box sx={{ 
                          bgcolor: '#f0f2f5', 
                          borderRadius: '16px', 
                          p: '8px 12px', 
                          width: '100%', 
                          ml: 0.5
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 0.5
                          }}>
                            <Typography variant="body2" fontWeight="bold">
                              {comment.createdBy?.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString('vi-VN')}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {comment.content}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* Comment Input - Fixed at bottom */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid #e0e0e0',
              bgcolor: '#fff'
            }}>
              <CommentInput postId={post._id} onCommentPosted={handleCommentPosted} />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {canEdit && <MenuItem onClick={handleEditClick}>Chỉnh sửa</MenuItem>}
        {canDelete && <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Xóa</MenuItem>}
      </Menu>
    </>
  );
}
