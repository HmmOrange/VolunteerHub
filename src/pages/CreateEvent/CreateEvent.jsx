import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createEvent } from "../api/events";
import "./CreateEvent.css";

export default function CreateEvent() {
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
  });

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createEvent({ ...form, username });
    if (res.message && res.message.includes("success")) {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-event-container">
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmit} className="create-event-form">
          <input
            type="text"
            placeholder="Event Name"
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
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            required
          />
          <button type="submit">Create Event</button>
        </form>
      </div>
    </>
  );
}
