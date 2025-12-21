import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { getUserEvents } from "../../api/Events";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Chip, Paper } from "@mui/material";
import { EventOutlined } from "@mui/icons-material";

// Setup localizer for moment
const localizer = momentLocalizer(moment);

// Cấu hình tiếng Việt cho moment
moment.locale('vi', {
  months: 'Tháng 1_Tháng 2_Tháng 3_Tháng 4_Tháng 5_Tháng 6_Tháng 7_Tháng 8_Tháng 9_Tháng 10_Tháng 11_Tháng 12'.split('_'),
  monthsShort: 'Th1_Th2_Th3_Th4_Th5_Th6_Th7_Th8_Th9_Th10_Th11_Th12'.split('_'),
  weekdays: 'Chủ nhật_Thứ hai_Thứ ba_Thứ tư_Thứ năm_Thứ sáu_Thứ bảy'.split('_'),
  weekdaysShort: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
  weekdaysMin: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm'
  },
  calendar: {
    sameDay: '[Hôm nay lúc] LT',
    nextDay: '[Ngày mai lúc] LT',
    nextWeek: 'dddd [tuần tới lúc] LT',
    lastDay: '[Hôm qua lúc] LT',
    lastWeek: 'dddd [tuần trước lúc] LT',
    sameElse: 'L'
  },
  relativeTime: {
    future: 'trong %s',
    past: '%s trước',
    s: 'vài giây',
    m: 'một phút',
    mm: '%d phút',
    h: 'một giờ',
    hh: '%d giờ',
    d: 'một ngày',
    dd: '%d ngày',
    M: 'một tháng',
    MM: '%d tháng',
    y: 'một năm',
    yy: '%d năm'
  },
  ordinalParse: /\d{1,2}/,
  ordinal: function (number) {
    return number;
  },
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  }
});

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setError("Vui lòng đăng nhập để xem lịch");
        setLoading(false);
        return;
      }

      const data = await getUserEvents(userId);
      
      // Transform events for calendar format
      const calendarEvents = data.events.map(event => {
        // Parse start and end times
        const startDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
        
        // Parse time strings (format: "HH:MM")
        if (event.startTime) {
          const [startHour, startMinute] = event.startTime.split(':');
          startDate.setHours(parseInt(startHour), parseInt(startMinute));
        }
        
        if (event.endTime) {
          const [endHour, endMinute] = event.endTime.split(':');
          endDate.setHours(parseInt(endHour), parseInt(endMinute));
        }

        return {
          id: event._id,
          title: event.name,
          start: startDate,
          end: endDate,
          resource: {
            slug: event.slug,
            location: event.location,
            description: event.description,
            banner: event.banner
          }
        };
      });

      setEvents(calendarEvents);
      setError(null);
    } catch (err) {
      console.error("Error fetching user events:", err);
      setError(err.message || "Không thể tải sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    // Navigate to event detail page when clicking on an event
    navigate(`/event/${event.resource.slug}`);
  };

  const handleSelectSlot = ({ start }) => {
    // Optional: Handle clicking on empty calendar slot
    console.log("Selected date:", start);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Custom event styling
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: '#49BBBD', /* Màu nhấn */
      borderRadius: '0.3125rem',
      opacity: 0.8,
      color: 'white',
      border: '0rem',
      display: 'block'
    };
    return { style };
  };

  // Format event title for week/day views to include time
  const eventTitleAccessor = (event) => {
    if (view === 'week' || view === 'day') {
      const startTime = moment(event.start).format('HH:mm');
      const endTime = moment(event.end).format('HH:mm');
      return `${startTime} - ${endTime} | ${event.title}`;
    }
    return event.title;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="70vh"
        sx={{ mt: { xs: 6, sm: 7, md: 8 } }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="70vh"
        sx={{ mt: { xs: 6, sm: 7, md: 8 } }}
      >
        <EventOutlined sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: 'text.secondary', mb: 2 }} />
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 2.5, md: 3 },
      mt: { xs: 6, sm: 7, md: 8 },
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        mb: { xs: 2, sm: 2.5, md: 3 }, 
        display: 'flex', 
        alignItems: 'center', 
        gap: { xs: 1, sm: 1.5, md: 2 },
        flexWrap: 'wrap'
      }}>
        <EventOutlined sx={{ 
          fontSize: { xs: 24, sm: 28, md: 32 }, 
          color: '#49BBBD'
        }} />
        <Typography 
          variant="h4" 
          component="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
          }}
        >
          Lịch Sự Kiện
        </Typography>
        <Chip 
          label={`${events.length} sự kiện`} 
          variant="outlined"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '1rem' },
            color: '#49BBBD',
            borderColor: '#49BBBD'
          }}
        />
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 0.5, sm: 1.5, md: 2 }, 
          height: { 
            xs: 'calc(100vh - 10rem)',
            sm: 'calc(100vh - 14rem)', 
            md: 'calc(100vh - 16rem)' 
          }, 
          minHeight: { xs: '22rem', sm: '31.25rem', md: '37.5rem' },
          overflow: 'auto',
          borderRadius: { xs: 1, sm: 1.5, md: 2 }
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor={eventTitleAccessor}
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          popup
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 6, 0, 0)}
          max={new Date(2024, 0, 1, 23, 0, 0)}
          scrollToTime={new Date(2024, 0, 1, 8, 0, 0)}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            agendaTimeFormat: 'HH:mm',
            agendaTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            dayFormat: (date) => moment(date).format('dd DD/MM'),
            weekdayFormat: (date) => moment(date).format('dddd'),
            monthHeaderFormat: (date) => moment(date).format('MMMM YYYY'),
            dayHeaderFormat: (date) => moment(date).format('dddd, DD MMMM YYYY'),
            dayRangeHeaderFormat: ({ start, end }) => 
              `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`,
          }}
          messages={{
            today: 'Hôm nay',
            previous: 'Trước',
            next: 'Sau',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            agenda: 'Lịch trình',
            date: 'Ngày',
            time: 'Thời gian',
            event: 'Sự kiện',
            allDay: 'Cả ngày',
            noEventsInRange: 'Không có sự kiện nào trong khoảng thời gian này',
            showMore: (total) => `+ Xem thêm ${total} sự kiện`
          }}
          style={{ height: '100%' }}
        />
      </Paper>
    </Box>
  );
}
