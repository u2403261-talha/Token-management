// Dashboard page: displays organizer events with create, edit, delete, and manage actions.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all events belonging to the logged-in organizer
  const loadEvents = async () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load events");
        return;
      }
      setEvents(data);
    } catch (err) {
      setError("Network error loading events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Create a new event with the entered title
  const handleCreate = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create event");
        return;
      }
      setTitle("");
      loadEvents();
    } catch (err) {
      setError("Network error creating event");
    }
  };

  // Prompt user for new title and update event
  const handleEdit = async (event) => {
    const newTitle = window.prompt("Enter new title:", event.title);
    if (!newTitle || newTitle.trim() === event.title) return;
    const jwt = localStorage.getItem("jwt");
    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update event");
        return;
      }
      loadEvents();
    } catch (err) {
      setError("Network error updating event");
    }
  };

  // Confirm and delete event and its tokens
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    const jwt = localStorage.getItem("jwt");
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to delete event");
        return;
      }
      loadEvents();
    } catch (err) {
      setError("Network error deleting event");
    }
  };

  // Log out by clearing jwt from localStorage
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="header-bar">
        <h2>Organizer Dashboard</h2>
        <button onClick={handleLogout} className="secondary">Logout</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading...</p>}

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit">Create Event</button>
      </form>

      <h3>My Events</h3>
      {events.length === 0 && !loading && <p style={{ textAlign: "center" }}>No events yet.</p>}

      {events.map((event) => (
        <div key={event._id} className="event-card">
          <span><strong>{event.title}</strong></span>
          <div className="button-group">
            <button onClick={() => navigate(`/events/${event._id}`)}>Manage</button>
            <button onClick={() => handleEdit(event)} className="secondary">Edit</button>
            <button onClick={() => handleDelete(event._id)} className="danger">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
