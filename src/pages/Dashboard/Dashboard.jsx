import { useEffect, useState } from "react";
import HNavbar from "../../components/HNavBar/HNavbar"; 
import { getAllEvents } from "../../api/Events";
import "./Dashboard.css";

export default function Dashboard() {
  const username = localStorage.getItem("username");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      setEvents(data);
    })();
  }, []);

  return (
    <>
      <HNavbar />
      <div className="dashboard-container">
        <h1>Chào mừng, {username || "User"}!</h1>
        <h3>Tất cả sử kiện:</h3>
        <div className="event-list">
          {events.length === 0 ? (
            <p>Chưa có sự kiện nào.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="event-card">
                <h4>{event.name}</h4>
                <p>{event.description}</p>
                <p><b>Location:</b> {event.location || "Chưa đề cập vị trí"}</p>
                <p><b>Date:</b> {new Date(event.date).toLocaleDateString()}</p>
                <small>
                  Created by: {event.createdBy?.username || "Unknown"}{" "}
                  | Approved: {event.approved ? "✅" : "❌"}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
