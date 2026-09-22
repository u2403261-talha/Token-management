import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storage } from "../services/storage";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import QRModal from "../components/QRModal";
import { StatCardSkeleton, EventCardSkeleton } from "../components/SkeletonLoader";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [tokensMap, setTokensMap] = useState({});
  const [allTokens, setAllTokens] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQREvent, setSelectedQREvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const currentUser = storage.getCurrentUser();
  const adminName = currentUser?.name || currentUser?.email ? (currentUser.name || currentUser.email.split("@")[0]) : "Admin";

  const loadData = async () => {
    if (!storage.getCurrentUser()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fetchedEvents = await storage.getEvents();
      setEvents(fetchedEvents);

      // Fetch tokens across all admin's events to compute exact status counts (Waiting, Serving, Completed)
      const tokensPromises = fetchedEvents.map((ev) =>
        storage.getTokens(ev._id).catch(() => [])
      );
      const tokenLists = await Promise.all(tokensPromises);
      
      const flatTokens = tokenLists.flat();
      setAllTokens(flatTokens);

      const map = {};
      fetchedEvents.forEach((ev, idx) => {
        map[ev._id] = tokenLists[idx] || [];
      });
      setTokensMap(map);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!formData.title || !formData.title.trim()) {
      setValidationError("Event Title is required.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await storage.createEvent(formData);
      setFormData({ title: "", description: "", date: "", time: "", location: "" });
      setShowCreateForm(false);
      setToast({ message: "Event created successfully", type: "success" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event and all associated tokens?")) return;
    try {
      await storage.deleteEvent(id);
      setToast({ message: "Event deleted successfully.", type: "info" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to delete event");
    }
  };

  const handleCopyLink = (eventId) => {
    const link = `${window.location.origin}/join/${eventId}`;
    navigator.clipboard.writeText(link);
    setToast({ message: "Join link copied to clipboard!", type: "info" });
  };

  // Search Filter: matches title, location, or date
  const filteredEvents = events.filter((ev) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.date && ev.date.toLowerCase().includes(q))
    );
  });

  // Calculate dynamic 5 real statistics from MongoDB
  const totalEvents = events.length;
  const totalParticipants = allTokens.length;
  const waitingTokensCount = allTokens.filter((t) => t.status === "waiting").length;
  const servingTokensCount = allTokens.filter((t) => t.status === "serving").length;
  const completedTokensCount = allTokens.filter((t) => t.status === "completed" || t.status === "done").length;

  return (
    <div className="app-layout">
      <Navbar />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {selectedQREvent && (
        <QRModal
          event={selectedQREvent}
          onClose={() => setSelectedQREvent(null)}
          onCopyLink={() => setToast({ message: "Join link copied to clipboard!", type: "info" })}
        />
      )}

      <main className="main-content">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Welcome back, {adminName}</h2>
            <p>Manage your events, participants and token queues.</p>
          </div>
          <div className="button-group">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="btn btn-primary"
            >
              {showCreateForm ? "✕ Close Form" : "+ Create Event"}
            </button>
            <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh data from database">
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* 5 Real MongoDB Statistics Cards */}
        <div className="stats-grid">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Total Events</div>
                  <div className="stat-value">{totalEvents}</div>
                </div>
                <div className="stat-icon primary">📅</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Total Participants</div>
                  <div className="stat-value">{totalParticipants}</div>
                </div>
                <div className="stat-icon accent">👥</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Waiting Tokens</div>
                  <div className="stat-value" style={{ color: "#D97706" }}>
                    {waitingTokensCount}
                  </div>
                </div>
                <div className="stat-icon warning">⏳</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Serving Tokens</div>
                  <div className="stat-value" style={{ color: "var(--primary)" }}>
                    {servingTokensCount}
                  </div>
                </div>
                <div className="stat-icon primary">🔔</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Completed Tokens</div>
                  <div className="stat-value" style={{ color: "var(--success)" }}>
                    {completedTokensCount}
                  </div>
                </div>
                <div className="stat-icon success">✅</div>
              </div>
            </>
          )}
        </div>

        {/* Create Event Section */}
        {showCreateForm && (
          <div className="card-section" style={{ border: "2px solid var(--primary)", animation: "fadeIn 0.25s ease-out" }}>
            <h3>Create New Queue Event</h3>
            <p style={{ fontSize: "0.875rem", marginBottom: "16px" }}>
              Fill in the event details to create a new token queue session.
            </p>

            {validationError && (
              <div className="error-banner" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
                <span>⚠️ {validationError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label htmlFor="event-title">Event Title *</label>
                <input
                  id="event-title"
                  type="text"
                  placeholder="e.g. Annual Tech Symposium 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">Description (Optional)</label>
                <input
                  id="event-description"
                  type="text"
                  placeholder="Brief summary or venue instructions"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                <div className="form-group">
                  <label htmlFor="event-date">Date (Optional)</label>
                  <input
                    id="event-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-time">Time (Optional)</label>
                  <input
                    id="event-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-location">Location (Optional)</label>
                  <input
                    id="event-location"
                    type="text"
                    placeholder="e.g. Auditorium Hall A"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="button-group" style={{ marginTop: "12px" }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating Event..." : "Create Event"}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Events Grid Section */}
        <div className="card-section">
          <div className="toolbar">
            <h3>My Events ({events.length})</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search events by title, location, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px 12px", fontSize: "0.875rem" }}
              />
            </div>
          </div>

          {loading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : events.length === 0 ? (
            /* Friendly Empty Events State */
            <div style={{ textAlign: "center", padding: "44px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📅</div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "6px" }}>No events yet</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                Create your first event to start managing your token queue.
              </p>
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                + Create Event
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
              <p style={{ fontWeight: 600 }}>No events match your search query "{searchTerm}".</p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const eventTokens = tokensMap[event._id] || [];
              const count = eventTokens.length || event.participantCount || event.lastTokenNumber || 0;
              return (
                <div key={event._id} className="event-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div className="event-info">
                      <h4>{event.title}</h4>
                      {event.description && (
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-serving" style={{ fontSize: "0.8rem" }}>
                      👥 {count} Participant{count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {(event.date || event.time || event.location) && (
                    <div style={{ display: "flex", gap: "16px", fontSize: "0.825rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      {event.date && <span>📅 Date: {event.date}</span>}
                      {event.time && <span>⏰ Time: {event.time}</span>}
                      {event.location && <span>📍 Location: {event.location}</span>}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed var(--card-border)", flexWrap: "wrap", gap: "8px" }}>
                    <div className="button-group">
                      <button onClick={() => navigate(`/events/${event._id}`)} className="btn btn-primary btn-sm">
                        Manage Event
                      </button>
                      <button onClick={() => handleCopyLink(event._id)} className="btn btn-secondary btn-sm">
                        Copy Join Link
                      </button>
                      <button onClick={() => setSelectedQREvent(event)} className="btn btn-secondary btn-sm">
                        📱 QR Code
                      </button>
                    </div>

                    <div className="button-group">
                      <button onClick={() => handleDelete(event._id)} className="btn btn-danger btn-sm" title="Delete event">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
