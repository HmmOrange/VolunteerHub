import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, Divider, Tabs, Tab, Container, Button,
  CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText,
  IconButton, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Badge, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  Menu, MenuItem,
} from "@mui/material";
import { Close as CloseIcon, LockOutlined, Edit as EditIcon, ErrorOutline, MoreVert as MoreVertIcon, Cancel, Stop, AccessTime, CheckCircle, PersonOff } from "@mui/icons-material";

// Import API
import {
  getEventBySlug, joinEvent, leaveEvent, removeMember,
  getPendingRequests, respondToJoinRequest, updateEvent, updateMemberAttendance, uploadBanner,
  uploadBadge, saveContributions
} from "../../api/Events";
import { getPostsByEvent } from "../../api/Posts";
import { createPost } from "../../api/Posts";

import CreatePost from "../../components/post/CreatePost";
import PostCard from "../../components/post/PostCard";
import PostModal from "../../components/post/PostModal";
import eventGroupAvatar from "../../assets/img/event_group.jpg";

import EventGroupVNavBar from "./EventGroupVNavBar";
import "./EventGroup.css";

export default function EventGroup() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const currentUserId = localStorage.getItem("userId");
  const currentUserUsername = localStorage.getItem("username"); 
  const [searchParams, setSearchParams] = useSearchParams();

  // === STATE ===
  const [eventData, setEventData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [postsLimit, setPostsLimit] = useState(10); // Giới hạn posts hiển thị
  const [hasMorePosts, setHasMorePosts] = useState(true); 
  
  const [openJoinModal, setOpenJoinModal] = useState(false);
  const [joinAnswer, setJoinAnswer] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);

  // Contribution tab state
  const [contributions, setContributions] = useState({}); // { userId: number }
  const [badgeFile, setBadgeFile] = useState(null);
  const [badgePreview, setBadgePreview] = useState(null);
  const [isEditingContributions, setIsEditingContributions] = useState(false);
  const [badgeConfirmOpen, setBadgeConfirmOpen] = useState(false);
  const [pendingBadgeFile, setPendingBadgeFile] = useState(null);
  const [pendingBadgePreview, setPendingBadgePreview] = useState(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", description: "", location: "", date: "",
    endDate: "", startTime: "", endTime: "",
    privacy: "Public", question: ""
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // State cho action menu
  const [anchorElActions, setAnchorElActions] = useState(null);
  const [openExtendDialog, setOpenExtendDialog] = useState(false);
  const [extendHours, setExtendHours] = useState(1);

  // State cho attendance menu
  const [anchorElAttendance, setAnchorElAttendance] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // State cho countdown timer
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [countdownLabel, setCountdownLabel] = useState("");
  const [autoEventStatus, setAutoEventStatus] = useState("");

  // State cho post modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  // 2. THÊM STATE ĐỂ LƯU LỖI (NẾU BỊ CHẶN)
  const [errorState, setErrorState] = useState(null); 
  // ==========================================

  // === LOGIC PHÂN QUYỀN ===
  const currentUserInEvent = eventData?.volunteers?.find(v => (v._id || v) === currentUserId);
  const currentUserIsCreator = eventData?.createdBy?._id === currentUserId || eventData?.createdBy === currentUserId;
  
  const isOwner = currentUserInEvent && currentUserIsCreator && currentUserInEvent.role === 'manager';

  // === HÀM TÍNH TRẠNG THÁI TỰ ĐỘNG ===
  const calculateEventStatus = (event) => {
    if (!event) return 'upcoming';
    
    // Chỉ giữ trạng thái cancelled nếu đã bị hủy
    if (event.eventStatus === 'cancelled') return 'cancelled';
    
    // Còn lại tất cả dựa vào thời gian thực tế
    const now = new Date();
    const startDate = new Date(event.date);
    if (event.startTime) {
      const [h, m] = event.startTime.split(':');
      startDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    const endDate = new Date(event.endDate || event.date);
    if (event.endTime) {
      const [h, m] = event.endTime.split(':');
      endDate.setHours(parseInt(h), parseInt(m), 0, 0);
    }
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  // === 1. HÀM XỬ LÝ AVATAR ===
  const getAvatarUrl = (user) => {
    if (!user || !user.avatar) return undefined;
    if (user.avatar.startsWith("http")) return user.avatar;
    const path = user.avatar.startsWith("/") ? user.avatar : `/${user.avatar}`;
    return `http://localhost:5000${path}`;
  };

  // === HÀM XỬ LÝ BANNER URL ===
  const getBannerUrl = (banner) => {
    if (!banner) return null;
    if (banner.startsWith("http")) return banner;
    if (banner.startsWith("data:")) return banner; // base64 cũ (nếu còn)
    const path = banner.startsWith("/") ? banner : `/${banner}`;
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

  const renderAvatarProps = (user) => {
    if (user?.avatar) {
      return { src: getAvatarUrl(user), children: null, sx: { bgcolor: 'transparent' } };
    }
    return {
      src: undefined,
      children: user?.username?.charAt(0).toUpperCase() || 'U',
      sx: { bgcolor: getAvatarColor(user?.role) }
    };
  };

  // === FETCH DATA ===
  useEffect(() => {
    if (slug && slug !== "undefined") {
      (async () => {
        try {
          const data = await getEventBySlug({ slug, userId: currentUserId });
          setEventData(data);
          setErrorState(null); // Reset lỗi nếu thành công

          if (data.volunteers) {
            const joined = data.volunteers.some(v => (v._id ? v._id.toString() : v.toString()) === currentUserId);
            setIsJoined(joined);
            
            if (joined) {
                setRequestStatus('joined');
            } else {
                if (data.requestStatus) {
                    setRequestStatus(data.requestStatus);
                } else if (data.requests && Array.isArray(data.requests)) {
                    const isPending = data.requests.some(req => 
                        (req.user?._id === currentUserId) || (req.user === currentUserId)
                    );
                    setRequestStatus(isPending ? 'pending' : null);
                }
            }

            const userIsAdminLocal = joined && (
                (data.createdBy?._id || data.createdBy) === currentUserId || 
                data.volunteers.some(v => (v._id === currentUserId || v === currentUserId) && v.role === 'manager')
            );
            
            if (userIsAdminLocal && data.requests) {
                setPendingRequests(data.requests);
            }
          }
        } catch (error) {
          let msg = "";
            
            // Bây giờ error.response sẽ tồn tại nhờ Bước 1
            if (error.response?.status === 403) {
                msg = "Đã có lỗi xảy ra khi tải sự kiện.";
            } else {
                msg = "Sự kiện chưa được duyệt hoặc đã bị từ chối.";
            }
            
            setErrorState(msg);
        }
      })();
    }
  }, [slug, currentUserId]);

  useEffect(() => {
    if (currentTab === 0 && eventData?._id) {
      const canViewPosts = (eventData.privacy === 'Public') || isJoined;
      if (!canViewPosts) {
          setPosts([]);
          setIsLoadingPosts(false);
          return;
      }
      setIsLoadingPosts(true);
      (async () => {
        try {
          const data = await getPostsByEvent(eventData._id);
          // Chỉ load một số posts ban đầu
          setPosts(data);
          setHasMorePosts(data.length > postsLimit);
        } catch (error) { setPosts([]); }
        setIsLoadingPosts(false);
      })();
    }
  }, [eventData, currentTab, isJoined]);

  // Sync tab from query param (?tab=)
  useEffect(() => {
    const t = parseInt(searchParams.get('tab') || '0', 10);
    if (!isNaN(t) && t !== currentTab) setCurrentTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (eventData?.slug && isOwner && currentTab === 3) {
      (async () => {
        try {
          const data = await getPendingRequests(eventData.slug);
          setPendingRequests(data);
        } catch (error) { }
      })();
    }
  }, [eventData, currentTab, isOwner]);

  // Initialize contributions and badge preview when event data changes
  useEffect(() => {
    if (eventData) {
      const map = {};
      // Prefer eventData.contributions if present
      if (Array.isArray(eventData.contributions) && eventData.contributions.length > 0) {
        eventData.contributions.forEach(c => {
          const uid = c.user?._id ? c.user._id : c.user;
          map[uid] = !!c.completed;
        });
      } else if (eventData.volunteers) {
        eventData.volunteers.forEach(m => {
          const memberId = m._id || m;
          map[memberId] = !!(m.contribution || m.completed || false);
        });
      }
      setContributions(map);
    }
    if (eventData?.badge) {
      setBadgePreview(getBannerUrl(eventData.badge));
    }
  }, [eventData]);

  // === COUNTDOWN TIMER ===
  useEffect(() => {
    if (!eventData) return;

    const calculateCountdown = () => {
      const now = new Date();
      
      // Tính trạng thái tự động
      const currentStatus = calculateEventStatus(eventData);
      setAutoEventStatus(currentStatus);
      
      // Nếu sự kiện đã hoàn thành hoặc bị hủy
      if (currentStatus === 'completed' || currentStatus === 'cancelled') {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setCountdownLabel(currentStatus === 'completed' ? 'Sự kiện đã kết thúc' : 'Sự kiện đã bị hủy');
        return;
      }

      // Tạo thời gian bắt đầu và kết thúc
      const startDate = new Date(eventData.date);
      if (eventData.startTime) {
        const [h, m] = eventData.startTime.split(':');
        startDate.setHours(parseInt(h), parseInt(m), 0, 0);
      }

      const endDate = new Date(eventData.endDate || eventData.date);
      if (eventData.endTime) {
        const [h, m] = eventData.endTime.split(':');
        endDate.setHours(parseInt(h), parseInt(m), 0, 0);
      }

      let targetDate;
      let label;

      // Xác định thời gian đích dựa trên trạng thái tự động
      if (currentStatus === 'upcoming' || now < startDate) {
        targetDate = startDate;
        label = 'Thời gian đến khi sự kiện bắt đầu';
      } else if (currentStatus === 'ongoing' || (now >= startDate && now < endDate)) {
        targetDate = endDate;
        label = 'Thời gian đến khi sự kiện kết thúc';
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setCountdownLabel('Sự kiện đã kết thúc');
        return;
      }

      const diff = targetDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setCountdownLabel('Sự kiện đã kết thúc');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
      setCountdownLabel(label);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventData]);

  // === HANDLERS (Giữ nguyên không đổi) ===
  const handleEditClick = () => {
    setEditForm({
      name: eventData.name,
      description: eventData.description,
      location: eventData.location,
      date: new Date(eventData.date).toISOString().split('T')[0],
      endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : new Date(eventData.date).toISOString().split('T')[0],
      startTime: eventData.startTime || "",
      endTime: eventData.endTime || "",
      privacy: eventData.privacy || "Public",
      question: eventData.question || "Tại sao bạn muốn tham gia sự kiện này?"
    });
    setBannerFile(null);
    setBannerPreview(getBannerUrl(eventData.banner) || null);
    setOpenEditModal(true);
  };

  const handleUpdateEvent = async () => {
    try {
      if (!isOwner) return alert("Bạn không có quyền chỉnh sửa.");
      let questionToSend = editForm.question;
      if (editForm.privacy === 'Private' && (!questionToSend || questionToSend.trim() === "")) {
          questionToSend = "Tại sao bạn muốn tham gia sự kiện này?";
      }
      const updated = await updateEvent({ ...editForm, question: questionToSend, slug: eventData.slug, username: currentUserUsername });
      
      // Upload banner nếu có file mới
      let finalBanner = updated.banner;
      let bannerUpdated = false;
      if (bannerFile) {
        try {
          const bannerRes = await uploadBanner(eventData.slug, bannerFile);
          finalBanner = bannerRes.banner;
          bannerUpdated = true;
        } catch (bannerErr) {
          console.error("Banner upload error:", bannerErr);
        }
      }
      // Upload badge nếu có file mới (badge upload moved into edit modal)
      let finalBadge = updated.badge;
      let badgeUpdated = false;
      if (badgeFile) {
        try {
          const badgeRes = await uploadBadge(eventData.slug, badgeFile);
          finalBadge = badgeRes.badge || badgeRes.badgePath || badgeRes.path || badgeRes.badge;
          badgeUpdated = true;
        } catch (badgeErr) {
          console.error("Badge upload error:", badgeErr);
        }
      }
      
      // Cập nhật eventData với thông tin mới
      setEventData(prev => ({ 
        ...prev,
        ...updated,
        banner: finalBanner,
        badge: finalBadge,
        createdBy: prev.createdBy, 
        volunteers: prev.volunteers, 
        requests: prev.requests 
      }));
      
      // Tự động tạo bài đăng khi cập nhật banner mới
      if (bannerUpdated && finalBanner) {
        try {
          console.log("Creating post with banner:", finalBanner);
          const newPost = await createPost({
            eventId: eventData._id,
            content: "📸 Banner sự kiện đã được cập nhật!",
            userId: currentUserId,
            username: currentUserUsername,
            imageUrl: finalBanner
          });
          console.log("Created post:", newPost);
          // Thêm post mới vào đầu danh sách
          setPosts(prev => [newPost, ...prev]);
        } catch (postErr) {
          console.error("Auto post creation error:", postErr);
        }
      }

      // Tạo post khi badge được cập nhật (tùy chọn)
      if (badgeUpdated && finalBadge) {
        try {
          const newPost = await createPost({
            eventId: eventData._id,
            content: "🏅 Badge sự kiện đã được cập nhật!",
            userId: currentUserId,
            username: currentUserUsername,
            imageUrl: finalBadge
          });
          setPosts(prev => [newPost, ...prev]);
        } catch (e) {
          console.error('Auto post for badge failed:', e);
        }
      }
      
      // Tính toán và cập nhật trạng thái mới ngay lập tức
      const newStatus = calculateEventStatus(updated);
      setAutoEventStatus(newStatus);
      
      // Reset banner state
      setBannerFile(null);
      setBannerPreview(null);
      
      setOpenEditModal(false);
      alert("Cập nhật thành công!");
      window.location.reload();
    } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleJoinClick = () => {
    if (!currentUserId) return alert("Bạn cần đăng nhập.");
    if (eventData.privacy === 'Private') setOpenJoinModal(true);
    else callJoinAPI("");
  };

  const callJoinAPI = async (answer) => {
    if (eventData.privacy === 'Private' && eventData.question && !answer.trim()) return alert("Vui lòng trả lời câu hỏi");
    try {
      const res = await joinEvent({ slug: eventData.slug, userId: currentUserId, answer });
      if (res.status === 'pending') {
        alert(res.message);
        setRequestStatus('pending');
      } else {
        alert("Tham gia thành công!");
        setIsJoined(true);
        setRequestStatus('joined');
        window.location.reload();
      }
      setOpenJoinModal(false);
    } catch (error) { alert(error.message); }
  };

  const handleLeaveEvent = async () => {
    if (isOwner && eventData.privacy === 'Private') {
      if (!window.confirm(
        "CẢNH BÁO: Bạn đang là Quản trị viên của nhóm Riêng tư.\n" +
        "Nếu bạn rời đi, nhóm sẽ tự động chuyển thành Công khai.\n" +
        "Bạn có chắc chắn muốn thực hiện?"
      )) return;
      try {
        await updateEvent({ slug: eventData.slug, privacy: 'Public', username: currentUserUsername });
      } catch (err) { return alert("Lỗi chuyển đổi trạng thái nhóm."); }
    } else {
      if (!window.confirm("Bạn chắc chắn muốn rời sự kiện này?")) return;
    }

    try { 
      await leaveEvent({ slug: eventData.slug, userId: currentUserId }); 
      alert("Đã rời sự kiện.");
      window.location.reload();
    } catch(e) { alert(e.message); }
  };

  const handleRespondToRequest = async (requestId, action) => {
    try {
        await respondToJoinRequest({ requestId, action, managerId: currentUserId });
        setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        if (action === 'approve') { 
            const d = await getEventBySlug({ slug, userId: currentUserId }); 
            setEventData(d); 
        }
    } catch (error) { alert(error.message); }
  };

  const handleSetContribution = (memberId, value) => {
    if (!isOwner) return;
    if (!isEditingContributions) return;
    setContributions(prev => ({ ...prev, [memberId]: value }));
  };

  // When owner selects a badge file, open confirm dialog before uploading
  const handleBadgeFileChange = (file) => {
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) { alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.'); return; }
    setPendingBadgeFile(file);
    setPendingBadgePreview(URL.createObjectURL(file));
    setBadgeConfirmOpen(true);
  };

  const handleConfirmBadgeUpload = async () => {
    if (!pendingBadgeFile) return;
    try {
      const res = await uploadBadge(eventData.slug, pendingBadgeFile);
      // Update eventData badge and preview
      setEventData(prev => ({ ...prev, badge: res.badge }));
      setBadgePreview(getBannerUrl(res.badge));
      setPendingBadgeFile(null);
      setPendingBadgePreview(null);
      setBadgeConfirmOpen(false);
      alert('Badge đã được cập nhật.');
    } catch (err) {
      alert(err.message || 'Upload thất bại');
    }
  };

  const handleCancelBadgeUpload = () => {
    setPendingBadgeFile(null);
    setPendingBadgePreview(null);
    setBadgeConfirmOpen(false);
  };

  const handleStartEditContributions = () => { setIsEditingContributions(true); };
  const handleCancelContributions = () => {
    // reset to eventData values
    const map = {};
    if (Array.isArray(eventData.contributions) && eventData.contributions.length > 0) {
      eventData.contributions.forEach(c => {
        const uid = c.user?._id ? c.user._id : c.user;
        map[uid] = c.value || 0;
      });
    }
    setContributions(map);
    setIsEditingContributions(false);
  };

  const handleConfirmContributions = async () => {
    try {
      const res = await saveContributions(eventData.slug, contributions);
      setEventData(res.event || res);
      setIsEditingContributions(false);
      alert('Đã lưu mức độ đóng góp.');
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu đóng góp');
    }
  };

  const handleKickMember = async (memberId) => {
    if(window.confirm("Mời thành viên này ra khỏi nhóm?")) {
        try { 
            await removeMember({ slug: eventData.slug, memberId, managerId: currentUserId }); 
            setEventData(p => ({...p, volunteers: p.volunteers.filter(v => (v._id || v) !== memberId)})); 
        } catch(e){ alert(e.message) }
    }
  };

  const handleOpenAttendanceMenu = (event, member) => {
    setAnchorElAttendance(event.currentTarget);
    setSelectedMember(member);
  };

  const handleCloseAttendanceMenu = () => {
    setAnchorElAttendance(null);
    setSelectedMember(null);
  };

  const handleMarkAttendance = async (status) => {
    if (!selectedMember) return;
    
    try {
      await updateMemberAttendance({
        slug: eventData.slug,
        userId: selectedMember._id,
        attendance: status,
        requesterId: currentUserId
      });

      // Cập nhật local state
      setEventData(prev => ({
        ...prev,
        volunteers: prev.volunteers.map(v => 
          v._id === selectedMember._id ? { ...v, attendance: status } : v
        )
      }));
    } catch (error) {
      alert(error.message);
    }

    handleCloseAttendanceMenu();
  };

  const handleOpenActionsMenu = (event) => {
    setAnchorElActions(event.currentTarget);
  };

  const handleCloseActionsMenu = () => {
    setAnchorElActions(null);
  };

  const handleCancelEvent = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn HỦY sự kiện này? Hành động này không thể hoàn tác!')) {
      return;
    }
    
    try {
      const updated = await updateEvent({ 
        slug: eventData.slug,
        action: 'cancel',
        username: currentUserUsername 
      });
      setEventData(prev => ({ ...prev, eventStatus: updated.eventStatus }));
      handleCloseActionsMenu();
      alert('Đã hủy sự kiện!');
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleEndEarly = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn KẾT THÚC SỚM sự kiện này?')) {
      return;
    }
    
    try {
      const updated = await updateEvent({ 
        slug: eventData.slug,
        action: 'end_early',
        username: currentUserUsername 
      });
      setEventData(prev => ({ 
        ...prev, 
        eventStatus: updated.eventStatus,
        endDate: updated.endDate,
        endTime: updated.endTime
      }));
      handleCloseActionsMenu();
      alert('Đã kết thúc sự kiện!');
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleExtendEvent = async () => {
    if (!extendHours || extendHours <= 0) {
      return alert('Vui lòng nhập số giờ hợp lệ');
    }
    
    try {
      const updated = await updateEvent({ 
        slug: eventData.slug,
        action: 'extend',
        extendHours: extendHours,
        username: currentUserUsername 
      });
      setEventData(prev => ({ 
        ...prev,
        endDate: updated.endDate,
        endTime: updated.endTime
      }));
      setOpenExtendDialog(false);
      handleCloseActionsMenu();
      alert(`Đã gia hạn sự kiện thêm ${extendHours} giờ!`);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // 4. KIỂM TRA LỖI VÀ RENDER MÀN HÌNH CHẶN (THÊM ĐOẠN NÀY TRƯỚC LOADING)
  if (errorState) {
    return (
      // Giữ nguyên layout nền xám để đồng bộ với App
      <Container maxWidth="lg" sx={{ p: 3, minHeight: '100vh', bgcolor: '#f1f4f7' }}>
          <Paper 
              elevation={0} 
              sx={{ 
                  p: 5, 
                  mt: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  borderRadius: 2
              }}
          >
              <ErrorOutline sx={{ fontSize: 80, color: '#ff6b6b', mb: 2 }} /> {/* Icon màu đỏ nhạt cho đẹp */}
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Truy cập bị từ chối
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '500px' }}>
                  {errorState} 
                  {/* Ở đây giờ sẽ hiện tiếng Việt mượt mà do Bước 1 */}
              </Typography>

              <Button 
                  variant="contained" 
                  onClick={() => navigate('/dashboard')}
                  sx={{ 
                      bgcolor: '#49BBBD', 
                      px: 4, 
                      py: 1,
                      '&:hover': { bgcolor: '#3daeb0' }
                  }}
              >
                  Về trang chủ
              </Button>
          </Paper>
      </Container>
    );
  }
  // =========================================================================

  if (!eventData) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress sx={{ color: '#49BBBD' }} /></Container>;

  return (
    // ... (Phần render giao diện chính GIỮ NGUYÊN không thay đổi gì cả)
    <Container maxWidth="lg" sx={{ p: 3, minHeight: '100vh', bgcolor: '#f1f4f7' }}>
      {/* EVENT BANNER COVER */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '30vh',
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={getBannerUrl(eventData.banner) || eventGroupAvatar}
          alt={eventData.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </Paper>
      
      {/* HEADER TABS */}
      <Paper className="event-group-tabs-paper" elevation={0} variant="outlined" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => {
              setCurrentTab(v);
              try { setSearchParams({ tab: String(v) }); } catch (e) { /* ignore */ }
            }}
            sx={{ flexGrow: 1, '& .Mui-selected': { color: '#49BBBD !important' }, '& .MuiTabs-indicator': { backgroundColor: '#49BBBD' } }}
          >
            <Tab label="Bài đăng" />
            <Tab label="Thông tin" />
            <Tab label="Thành viên" />
              {isOwner && (
                <Tab label={<Badge badgeContent={pendingRequests.length} color="error">Yêu cầu tham gia</Badge>} />
              )}
          </Tabs>

          {!isJoined ? (
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleJoinClick} 
              // Chỉ disable khi đang chờ duyệt, 'rejected' hoặc null đều bấm được
              disabled={requestStatus === 'pending'} 
              sx={{ ml: 2, bgcolor: '#49BBBD' }}
            >
              {/* Logic hiển thị chữ trên nút */}
              {requestStatus === 'pending' 
                ? "Đang chờ duyệt" 
                : "Tham gia"
              }
            </Button>
          ) : (
            // Người tổ chức thấy menu actions, người khác thấy nút rời khỏi
            currentUserIsCreator ? (
              <>
                <IconButton 
                  size="small" 
                  onClick={handleOpenActionsMenu} 
                  sx={{ ml: 2, color: '#49BBBD' }}
                >
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorElActions}
                  open={Boolean(anchorElActions)}
                  onClose={handleCloseActionsMenu}
                >
                  <MenuItem onClick={handleCancelEvent}>
                    <Cancel sx={{ mr: 1}} />
                    <Typography color="error">Hủy sự kiện</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleEndEarly}>
                    <Stop sx={{ mr: 1}} />
                    <Typography color="warning.main">Kết thúc sớm</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => { handleCloseActionsMenu(); setOpenExtendDialog(true); }}>
                    <AccessTime sx={{ mr: 1}} />
                    <Typography color="primary">Gia hạn sự kiện</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="outlined" color="inherit" size="small" onClick={handleLeaveEvent} sx={{ ml: 2, color: 'gray', borderColor: 'gray' }}>
                Rời khỏi
              </Button>
            )
          )}
        </Box>
      </Paper>

      <Box className="event-group-content-area" sx={{ mt: 0 }}>
        {/* TAB 0: POSTS */}
        {currentTab === 0 && (
          (eventData.privacy === 'Private' && !isJoined) ? (
            <Paper sx={{ py: 8, mt: 2, textAlign: 'center' }} variant="outlined">
              <LockOutlined sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Nhóm riêng tư</Typography>
              <Typography variant="body2" color="text.secondary">Bạn cần tham gia sự kiện để xem bài đăng</Typography>
              {requestStatus !== 'pending' && <Button variant="contained" onClick={handleJoinClick} sx={{ mt: 2, bgcolor: '#49BBBD' }}>Tham gia ngay</Button>}
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* PHẦN BÀI ĐĂNG BÊN TRÁI */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isJoined && <CreatePost eventId={eventData._id} onPostCreated={(p) => setPosts([p, ...posts])} />}
                {isLoadingPosts ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress sx={{ color: '#49BBBD' }}/></Box> : 
                 posts.length === 0 ? <Typography textAlign="center" sx={{ mt: 2 }}>Chưa có bài đăng nào.</Typography> :
                 posts.map(post => (
                   <PostCard 
                     key={post._id} 
                     post={post} 
                     eventOwnerId={eventData.createdBy?._id || eventData.createdBy} 
                     onPostDeleted={(id) => setPosts(posts.filter(p => p._id !== id))} 
                     onPostUpdated={(updated) => setPosts(posts.map(p => p._id === updated._id ? updated : p))}
                     onPostClick={(post) => {
                       setSelectedPost(post);
                       setPostModalOpen(true);
                     }}
                   />
                 ))
                }
              </Box>

              {/* COUNTDOWN TIMER BÊN PHẢI */}
              <Paper 
                elevation={3}
                sx={{ 
                  width: '320px',
                  flexShrink: 0,
                  height: 'fit-content',
                  position: 'sticky',
                  top: '85px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #49BBBD 0%, #3daeb0 100%)',
                  borderRadius: 3
                }}
              >
                {/* HEADER */}
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(10px)',
                  p: 2.5,
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Đồng hồ sự kiện
                  </Typography>
                </Box>
                
                {/* COUNTDOWN DISPLAY */}
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: countdown.days > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                    gap: 1.5,
                    mb: 2
                  }}>
                    {/* Days */}
                    {countdown.days > 0 && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ 
                          bgcolor: 'white',
                          borderRadius: 2,
                          p: 1.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          minHeight: '64px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography 
                            variant="h5" 
                            fontWeight="bold"
                            sx={{ 
                              color: '#49BBBD',
                              lineHeight: 1,
                              fontFamily: 'monospace'
                            }}
                          >
                            {String(countdown.days).padStart(2, '0')}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            mt: 0.5, 
                            display: 'block',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          Ngày
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Hours */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'white',
                        borderRadius: 2,
                        p: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minHeight: '64px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold"
                          sx={{ 
                            color: '#49BBBD',
                            lineHeight: 1,
                            fontFamily: 'monospace'
                          }}
                        >
                          {String(countdown.hours).padStart(2, '0')}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Giờ
                      </Typography>
                    </Box>
                    
                    {/* Minutes */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'white',
                        borderRadius: 2,
                        p: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minHeight: '64px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold"
                          sx={{ 
                            color: '#49BBBD',
                            lineHeight: 1,
                            fontFamily: 'monospace'
                          }}
                        >
                          {String(countdown.minutes).padStart(2, '0')}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Phút
                      </Typography>
                    </Box>
                    
                    {/* Seconds */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'white',
                        borderRadius: 2,
                        p: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minHeight: '64px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold"
                          sx={{ 
                            color: '#49BBBD',
                            lineHeight: 1,
                            fontFamily: 'monospace'
                          }}
                        >
                          {String(countdown.seconds).padStart(2, '0')}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Giây
                      </Typography>
                    </Box>
                  </Box>

                  {/* COUNTDOWN LABEL */}
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    mt: 2
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}
                    >
                      {countdownLabel}
                    </Typography>
                  </Box>
                </Box>

                {/* TRẠNG THÁI SỰ KIỆN */}
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderTop: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold" 
                    sx={{ mb: 1.5, color: 'white', textAlign: 'center' }}
                  >
                    Trạng thái sự kiện
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Chip
                      label={
                        autoEventStatus === 'upcoming' ? 'Sắp diễn ra' :
                        autoEventStatus === 'ongoing' ? 'Đang diễn ra' :
                        autoEventStatus === 'completed' ? 'Đã hoàn thành' :
                        autoEventStatus === 'cancelled' ? 'Đã bị hủy' :
                        'Sắp diễn ra'
                      }
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.85rem',
                        bgcolor: 'white',
                        color: autoEventStatus === 'upcoming' ? '#1976d2' :
                               autoEventStatus === 'ongoing' ? '#2e7d32' :
                               autoEventStatus === 'completed' ? '#757575' :
                               autoEventStatus === 'cancelled' ? '#d32f2f' :
                               '#1976d2',
                        px: 2,
                        py: 1.5,
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* THÔNG TIN THỜI GIAN */}
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Stack spacing={1}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 1.5,
                      p: 1.5
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                        <b>Bắt đầu:</b>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {new Date(eventData.date).toLocaleDateString('vi-VN')}
                        {eventData.startTime && ` ${eventData.startTime}`}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 1.5,
                      p: 1.5
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                        <b>Kết thúc:</b>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {new Date(eventData.endDate || eventData.date).toLocaleDateString('vi-VN')}
                        {eventData.endTime && ` ${eventData.endTime}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          )
        )}

        {/* TAB 1: THÔNG TIN */}
        {currentTab === 1 && (
          <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
            {/* Header & Edit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Thông tin sự kiện</Typography>
              {isOwner && (
                <Button startIcon={<EditIcon />} variant="contained" size="small" onClick={handleEditClick} sx={{ bgcolor: '#49BBBD' }}>
                  Chỉnh sửa
                </Button>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />

            {/* --- BANNER SECTION --- */}
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Banner sự kiện</Typography>
            <Box
              sx={{
                width: '20vw',
                height: '20vh',
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e0e0e0'
              }}
            >
              {eventData.banner ? (
                <img
                  src={getBannerUrl(eventData.banner)}
                  alt="Banner"
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">No banner</Typography>
              )}
            </Box>

            {/* --- BADGE SECTION (Moved Here) --- */}
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Badge sự kiện</Typography>
            <Box 
              sx={{ 
                width: '20vw', // Badge thường hình vuông hoặc nhỏ hơn banner
                height: '20vh',
                mb: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                overflow: 'hidden', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid #e0e0e0'
              }}
            >
              {badgePreview ? (
                <img src={badgePreview} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Typography variant="caption" color="text.secondary">Chưa có badge</Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* --- DETAILS SECTION --- */}
            <Stack spacing={1}>
                <Typography><b>Tên sự kiện:</b> {eventData.name}</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}><b>Mô tả:</b> {eventData.description}</Typography>
                <Typography><b>Địa điểm:</b> {eventData.location}</Typography>
                <Typography><b>Ngày tổ chức:</b> {new Date(eventData.date).toLocaleDateString('vi-VN')}</Typography>
                <Typography><b>Quyền riêng tư:</b> {eventData.privacy === 'Private' ? 'Riêng tư' : 'Công khai'}</Typography>
                <Typography><b>Trạng thái:</b> {
                  autoEventStatus === 'upcoming' ? 'Sắp diễn ra' :
                  autoEventStatus === 'ongoing' ? 'Đang diễn ra' :
                  autoEventStatus === 'completed' ? 'Đã hoàn thành' :
                  autoEventStatus === 'cancelled' ? 'Đã bị hủy' :
                  'Sắp diễn ra'
                }</Typography>
                <Typography><b>Người tạo:</b> {eventData.createdBy?.username || "Không xác định"}</Typography>
                
                {isOwner && eventData.privacy === 'Private' && eventData.question && (
                    <Typography sx={{ mt: 1 }}><b>Câu hỏi tham gia:</b> {eventData.question}</Typography>
                )}
            </Stack>
          </Paper>
        )}

        {/* TAB 2: THÀNH VIÊN */}
        {currentTab === 2 && (
          <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
            <Typography variant="h6">Thành viên ({eventData?.volunteers?.length || 0})</Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
                {eventData.volunteers?.map((member) => {
                    const memberId = member._id || member;
                    const role = member.role?.toLowerCase() || 'volunteer';
                    const memberIsCreator = memberId === (eventData.createdBy?._id || eventData.createdBy);
                    
                    const avatarProps = renderAvatarProps(member);
                    
                    // Kiểm tra trạng thái sự kiện để hiển thị attendance options
                    const currentEventStatus = autoEventStatus || calculateEventStatus(eventData);
                    // Only allow marking attendance after the event is completed
                    const canMarkAttendance = isOwner && memberId !== currentUserId &&
                                             (currentEventStatus === 'completed');

                    return (
                        <ListItem key={memberId} secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              {/* Hiển thị trạng thái attendance */}
                              {member.attendance && member.attendance !== 'pending' && (
                                <Chip 
                                  icon={member.attendance === 'completed' ? <CheckCircle /> : <PersonOff />}
                                  label={member.attendance === 'completed' ? 'Đã tham gia' : 'Không tham gia'} 
                                  size="small"
                                  color={member.attendance === 'completed' ? 'success' : 'error'}
                                  variant="outlined"
                                  sx={{ height: 24, fontSize: '0.75rem' }}
                                />
                              )}
                              
                              {/* Menu attendance cho quản lý (khi sự kiện ongoing hoặc completed) */}
                              {isOwner && memberId !== currentUserId && 
                               (currentEventStatus === 'completed') && (
                                <IconButton 
                                  size="small"
                                  onClick={(e) => handleOpenAttendanceMenu(e, member)}
                                  sx={{ color: '#49BBBD' }}
                                  title="Đánh dấu tham gia"
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              )}
                              
                              {/* Nút kick member - luôn hiển thị cho owner */}
                              {isOwner && memberId !== currentUserId && (
                                <IconButton 
                                  onClick={() => handleKickMember(memberId)}
                                  title="Xóa khỏi sự kiện"
                                  size="small"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                        }>
                            <ListItemAvatar>
                                <Avatar {...avatarProps} />
                            </ListItemAvatar>
                            <ListItemText 
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography>{member.username}</Typography>
                                    {memberIsCreator && <Chip label="Người tổ chức" size="small" variant="outlined" sx={{ color: '#9c27b0', borderColor: '#9c27b0', height: 20 }} />}
                                    {role === 'manager' && <Chip label="Quản lý" size="small" variant="outlined" sx={{ color: '#49BBBD', borderColor: '#49BBBD', height: 20 }} />}
                                    {role === 'volunteer' && (
                                      <Chip label="Tình nguyện viên" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: '#e0e0e0', height: 20, fontSize: '0.7rem' }} />
                                    )}
                                    {role === 'admin' && (
                                      <Chip label="Admin" size="small" variant="outlined" sx={{ color: '#d32f2f', borderColor: '#d32f2f', height: 20, fontSize: '0.7rem' }} />
                                    )}
                                  </Stack>
                                } 
                                secondary={member.email} 
                            />
                        </ListItem>
                    );
                })}
            </List>
            
            {/* Menu attendance */}
            <Menu
              anchorEl={anchorElAttendance}
              open={Boolean(anchorElAttendance)}
              onClose={handleCloseAttendanceMenu}
            >
              <MenuItem onClick={() => handleMarkAttendance('completed')}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
                Đánh dấu hoàn thành
              </MenuItem>
              <MenuItem onClick={() => handleMarkAttendance('absent')}>
                <PersonOff sx={{ mr: 1, color: 'error.main' }} fontSize="small" />
                Đánh dấu không tham gia
              </MenuItem>
            </Menu>
          </Paper>
        )}

        {/* TAB 3: YÊU CẦU THAM GIA */}
        {currentTab === 3 && isOwner && (
          <Paper sx={{ mt: 2 }} variant="outlined">
            <Typography variant="h6" sx={{ p: 2 }}>Yêu cầu ({pendingRequests.length})</Typography>
            <Divider />
            <List>
              {pendingRequests.map(req => (
                <ListItem key={req._id} secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" sx={{ bgcolor: "#49BBBD" }} onClick={() => handleRespondToRequest(req._id, "approve")}>Duyệt</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleRespondToRequest(req._id, 'reject')}>Từ chối</Button>
                  </Stack>
                }>
                   <ListItemAvatar>
                      <Avatar {...renderAvatarProps(req.user)} />
                   </ListItemAvatar>
                   <ListItemText primary={req.user?.username} secondary={req.answer} />
                </ListItem>
              ))}
              {pendingRequests.length === 0 && (
                  <Typography textAlign="center" sx={{p: 2, color: 'text.secondary'}}>Không có yêu cầu nào.</Typography>
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* MODAL JOIN */}
      <Dialog open={openJoinModal} onClose={() => setOpenJoinModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trả lời câu hỏi</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{eventData.question}</Typography>
          <TextField fullWidth multiline rows={3} value={joinAnswer} onChange={(e) => setJoinAnswer(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenJoinModal(false)}>Hủy</Button>
          <Button onClick={() => callJoinAPI(joinAnswer)} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Gửi</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XÁC NHẬN THAY ĐỔI BADGE */}
      <Dialog open={badgeConfirmOpen} onClose={handleCancelBadgeUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Bạn có chắc chắn muốn thay đổi Badge sự kiện?</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {pendingBadgePreview ? (
              <img src={pendingBadgePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300 }} />
            ) : (
              <Typography>Không có ảnh để xem trước</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBadgeUpload}>Hủy</Button>
          <Button variant="contained" onClick={handleConfirmBadgeUpload} sx={{ bgcolor: '#49BBBD' }}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL EDIT */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Tên" fullWidth value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            <TextField label="Mô tả" fullWidth multiline rows={4} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
            <TextField label="Địa điểm" fullWidth value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
            
            {/* Banner Upload */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Banner sự kiện
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Ảnh phải nhỏ hơn 2MB
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: bannerPreview ? 2 : 0 }}
              >
                {bannerFile ? "Thay đổi banner" : (bannerPreview ? "Cập nhật banner" : "Chọn banner")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Kiểm tra kích thước file (2MB = 2 * 1024 * 1024 bytes)
                      const maxSize = 2 * 1024 * 1024;
                      if (file.size > maxSize) {
                        alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hưn 2MB.');
                        e.target.value = ''; // Reset input
                        return;
                      }
                      setBannerFile(file);
                      setBannerPreview(URL.createObjectURL(file)); // Preview file mới từ browser
                    }
                  }}
                />
              </Button>
              {bannerPreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
            
            {/* Badge Upload (moved into Edit modal) */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>Badge sự kiện</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Ảnh phải nhỏ hơn 2MB
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: badgePreview ? 2 : 0 }}
              >
                {badgeFile ? "Thay đổi badge" : (badgePreview ? "Cập nhật badge" : "Chọn badge")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const maxSize = 2 * 1024 * 1024;
                      if (file.size > maxSize) {
                        alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 2MB.');
                        e.target.value = '';
                        return;
                      }
                      setBadgeFile(file);
                      setBadgePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </Button>
              {badgePreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={badgePreview}
                    alt="Badge preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField 
                label="Ngày bắt đầu" 
                type="date" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={editForm.date} 
                onChange={(e) => setEditForm({...editForm, date: e.target.value})} 
              />
              <TextField 
                label="Giờ bắt đầu" 
                type="time" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={editForm.startTime} 
                onChange={(e) => setEditForm({...editForm, startTime: e.target.value})} 
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField 
                label="Ngày kết thúc" 
                type="date" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={editForm.endDate} 
                onChange={(e) => setEditForm({...editForm, endDate: e.target.value})} 
              />
              <TextField 
                label="Giờ kết thúc" 
                type="time" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={editForm.endTime} 
                onChange={(e) => setEditForm({...editForm, endTime: e.target.value})} 
              />
            </Box>

            <FormControl>
              <FormLabel>Quyền riêng tư</FormLabel>
              <RadioGroup row value={editForm.privacy} onChange={(e) => setEditForm({...editForm, privacy: e.target.value})}>
                <FormControlLabel value="Public" control={<Radio />} label="Công khai" />
                <FormControlLabel value="Private" control={<Radio />} label="Riêng tư" />
              </RadioGroup>
            </FormControl>
            {editForm.privacy === 'Private' && (
              <TextField label="Câu hỏi tham gia" fullWidth value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Hủy</Button>
          <Button onClick={handleUpdateEvent} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG GIA HẠN SỰ KIỆN */}
      <Dialog open={openExtendDialog} onClose={() => setOpenExtendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gia hạn sự kiện</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Nhập số giờ bạn muốn gia hạn thêm cho sự kiện
          </Typography>
          <TextField
            label="Số giờ gia hạn"
            type="number"
            fullWidth
            value={extendHours}
            onChange={(e) => setExtendHours(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: 72 }}
            helperText="Tối đa 72 giờ"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExtendDialog(false)}>Hủy</Button>
          <Button onClick={handleExtendEvent} variant="contained" sx={{ bgcolor: '#49BBBD' }}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* POST MODAL */}
      {selectedPost && (
        <PostModal
          open={postModalOpen}
          onClose={() => {
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onPostDeleted={(id) => {
            setPosts(posts.filter(p => p._id !== id));
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
          onPostUpdated={(updated) => {
            setPosts(posts.map(p => p._id === updated._id ? updated : p));
            setSelectedPost(updated);
          }}
          eventOwnerId={eventData?.createdBy?._id || eventData?.createdBy}
        />
      )}
    </Container>
  );
}