import { useEffect, useState } from "react";
import Navbar from "../../components/HNavBar/HNavbar";
import { getAllEvents, deleteEvent, updateEvent } from "../../api/Events";
import "./Dashboard.css";

export default function Dashboard() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", date: "", location: "", description: "" });

  useEffect(() => {
    (async () => {
      const data = await getAllEvents();
      setEvents(data);
    })();
  }, []);

  const handleDelete = async (eventId) => {
    if (window.confirm("Bạn có chắc muốn xóa sự kiện này?")) {
      await deleteEvent({ eventId, username });
      const data = await getAllEvents();
      setEvents(data);
    }
  };

  const handleEdit = (event) => {
    setEditing(event._id);
    setForm({
      name: event.name,
      date: event.date.split("T")[0],
      location: event.location,
      description: event.description,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateEvent({ ...form, username, eventId: editing });
    setEditing(null);
    const data = await getAllEvents();
    setEvents(data);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <h1>Xin chào, {username || "Người dùng"}!</h1>
        <h3>Danh sách sự kiện</h3>

        <div className="event-list">
          {events.length === 0 ? (
            <p>Chưa có sự kiện nào.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="event-card">
                {editing === event._id ? (
                  <form onSubmit={handleUpdate} className="edit-form">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <button type="submit">Lưu</button>
                    <button onClick={() => setEditing(null)} type="button">
                      Hủy
                    </button>
                  </form>
                ) : (
                  <>
                    <h4>{event.name}</h4>
                    <p>{event.description}</p>
                    <p>
                      <b>Địa điểm:</b> {event.location || "Chưa xác định"}
                    </p>
                    <p>
                      <b>Ngày:</b> {new Date(event.date).toLocaleDateString()}
                    </p>
                    <small>
                      Người tạo: {event.createdBy?.username || "Không rõ"} | Đã duyệt:{" "}
                      {event.approved ? "✅" : "❌"}
                    </small>
                    {(role === "manager" ||
                      event.createdBy?.username === username) && (
                      <div className="event-actions">
                        <button onClick={() => handleEdit(event)}>Chỉnh sửa</button>
                        <button onClick={() => handleDelete(event._id)}>Xóa</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
