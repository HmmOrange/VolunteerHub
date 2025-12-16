import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAllEvents } from "../../api/Events";
import { getPostsByEvent } from "../../api/Posts";
import {
  Card,
  CardContent,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
} from "@mui/material";

import "./Dashboard.css";
import PostCard from "../../components/post/PostCard";

export default function Dashboard() {
  const navigate = useNavigate(); 
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  const [upcomingJoinedEvents, setUpcomingJoinedEvents] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const events = await getAllEvents();

      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // ===== JOINED EVENTS =====
      const joinedEvents = events.filter((event) =>
        event.volunteers?.some((v) =>
          typeof v === "string"
            ? v === userId
            : v._id?.toString() === userId
        )
      );

      // ===== UPCOMING (DATE + TIME) =====
      const upcoming = joinedEvents.filter((event) => {
        if (!event.date) return false;

        const eventDate = new Date(event.date);

        // Future date
        if (eventDate > today) return true;

        // Same day → compare time
        if (eventDate.getTime() === today.getTime()) {
          if (!event.startTime) return true;

          const [h, m] = event.startTime.split(":").map(Number);
          const eventTime = new Date(today);
          eventTime.setHours(h, m, 0, 0);

          return eventTime >= now;
        }

        return false;
      });

      // Sort by date then startTime
      upcoming.sort((a, b) => {
        const d1 = new Date(a.date);
        const d2 = new Date(b.date);

        if (d1.getTime() !== d2.getTime()) {
          return d1 - d2;
        }

        return (a.startTime || "").localeCompare(b.startTime || "");
      });

      setUpcomingJoinedEvents(upcoming);

      // ===== POSTS FEED (JOINED EVENTS) =====
      const postsArrays = await Promise.all(
        joinedEvents.map((event) => getPostsByEvent(event._id))
      );

      const sortedPosts = postsArrays
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFeedPosts(sortedPosts);
    })();
  }, [userId]);

  const renderTime = (start, end) => {
    if (!start) return "Không rõ thời gian";
    return end ? `${start} – ${end}` : start;
  };

  // ===== PostCard callbacks =====
  const handlePostDeleted = (postId) => {
    setFeedPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setFeedPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  return (
    <Container maxWidth="lg" className="dashboard-container-split">
      <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
        Xin chào, {username || "Người dùng"}!
      </Typography>

      {/* ================= UPCOMING JOINED EVENTS ================= */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Sự kiện sắp diễn ra bạn đã tham gia
        </Typography>

        {upcomingJoinedEvents.length === 0 ? (
          <Typography color="text.secondary">
            Bạn không có sự kiện sắp diễn ra
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {upcomingJoinedEvents.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card
                  className="event-card-clickable"
                  onClick={() => navigate(`/event/${event.slug}`)}
                >
                  <CardContent>
                    <Typography variant="h6">{event.name}</Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {event.description}
                    </Typography>

                    <Typography variant="body2">
                      <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                    </Typography>

                    <Typography variant="body2">
                      <b>Ngày:</b>{" "}
                      {new Date(event.date).toLocaleDateString()}
                    </Typography>

                    <Typography variant="body2">
                      <b>Thời gian:</b>{" "}
                      {renderTime(event.startTime, event.endTime)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* ================= EVENT POSTS FEED ================= */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Bài viết từ các sự kiện bạn đã tham gia
        </Typography>

        {feedPosts.length === 0 ? (
          <Typography color="text.secondary">
            Chưa có bài viết nào
          </Typography>
        ) : (
          <Stack spacing={2}>
            {feedPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
