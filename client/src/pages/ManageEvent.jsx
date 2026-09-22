import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { storage } from "../services/storage";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { TableRowSkeleton } from "../components/SkeletonLoader";

function ManageEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [attendeeName, setAttendeeName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("number-asc");
  const [updatingTokenId, setUpdatingTokenId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const navigate = useNavigate();

  const joinUrl = `${window.location.origin}/join/${id}`;

  const loadData = async () => {
    if (!storage.getCurrentUser()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const eventData = await storage.getEvent(id);
      setEvent(eventData);

      const tokensData = await storage.getTokens(id);
      setTokens(tokensData);
    } catch (err) {
      setError(err.message || "Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!attendeeName.trim()) return;
    setIssuing(true);
    try {
      const createdToken = await storage.joinEvent(id, attendeeName.trim(), event ? event.title : "");
      setAttendeeName("");
      const formattedNum = `T${String(createdToken.tokenNumber).padStart(3, "0")}`;
      setToast({
        message: `Issued Token ${formattedNum} for ${createdToken.name}!`,
        type: "success",
      });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to issue token");
    } finally {
      setIssuing(false);
    }
  };

  const handleStatusChange = async (tokenId, tokenNum, newStatus) => {
    setUpdatingTokenId(tokenId);
    try {
      await storage.updateTokenStatus(tokenId, newStatus);
      const formattedNum = `T${String(tokenNum).padStart(3, "0")}`;
      setToast({ message: `Token ${formattedNum} status updated to ${newStatus.toUpperCase()}`, type: "success" });
      loadData();
    } catch (err) {
      setError(err.message || "Failed to update token status");
    } finally {
      setUpdatingTokenId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setToast({ message: "Join link copied to clipboard!", type: "info" });
  };

  const formatTokenNumber = (num) => `T${String(num).padStart(3, "0")}`;

  // Filter & Sort Participants
  const filteredTokens = tokens
    .filter((t) => {
      const formattedNum = formatTokenNumber(t.tokenNumber);
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        formattedNum.toLowerCase().includes(q) ||
        String(t.tokenNumber).includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        t.status === statusFilter ||
        (statusFilter === "completed" && t.status === "done");

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "number-asc") return a.tokenNumber - b.tokenNumber;
      if (sortBy === "number-desc") return b.tokenNumber - a.tokenNumber;
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  const waitingCount = tokens.filter((t) => t.status === "waiting").length;
  const servingCount = tokens.filter((t) => t.status === "serving").length;
  const completedCount = tokens.filter((t) => t.status === "completed" || t.status === "done").length;

  return (
    <div className="app-layout">
      <Navbar />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <main className="main-content">
        <div style={{ marginBottom: "16px" }}>
          <Link to="/dashboard" className="link-text">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Event Header */}
        <div className="card-section" style={{ marginBottom: "24px" }}>
          <div className="dashboard-header" style={{ marginBottom: (event?.description || event?.date || event?.location) ? "12px" : "0" }}>
            <div className="dashboard-title">
              <h2>{event ? event.title : "Manage Event"}</h2>
              {event?.description && <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>{event.description}</p>}
            </div>
            <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh queue from database">
              🔄 Refresh Queue
            </button>
          </div>

          {event && (event.date || event.time || event.location) && (
            <div style={{ display: "flex", gap: "20px", fontSize: "0.875rem", color: "var(--text-muted)", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px dashed var(--card-border)" }}>
              {event.date && <span>📅 <strong>Date:</strong> {event.date}</span>}
              {event.time && <span>⏰ <strong>Time:</strong> {event.time}</span>}
              {event.location && <span>📍 <strong>Location:</strong> {event.location}</span>}
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Real Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Participants</div>
              <div className="stat-value">{tokens.length}</div>
            </div>
            <div className="stat-icon primary">👥</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Waiting</div>
              <div className="stat-value" style={{ color: "#D97706" }}>
                {waitingCount}
              </div>
            </div>
            <div className="stat-icon warning">⏳</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Serving</div>
              <div className="stat-value" style={{ color: "var(--primary)" }}>
                {servingCount}
              </div>
            </div>
            <div className="stat-icon accent">🔔</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: "var(--success)" }}>
                {completedCount}
              </div>
            </div>
            <div className="stat-icon success">✅</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "28px" }}>
          {/* Distinct Visually Separated QR Code Section */}
          <div className="qr-card" style={{ border: "2px solid var(--card-border)" }}>
            <h4 style={{ fontSize: "1.1rem" }}>Scan to Join</h4>
            <div className="qr-code-wrapper">
              <QRCodeSVG value={joinUrl} size={150} />
            </div>
            <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-muted)" }}>
              Students can scan this QR code to join the event.
            </p>
            <div style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--primary)", background: "var(--bg-subtle)", padding: "6px 12px", borderRadius: "6px", width: "100%", wordBreak: "break-all" }}>
              {joinUrl}
            </div>
            <button onClick={handleCopyLink} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
              📋 Copy Link
            </button>
          </div>

          {/* Issue Walk-in Token Card */}
          <div className="card-section" style={{ margin: 0 }}>
            <h3>Issue Walk-in Token</h3>
            <p style={{ fontSize: "0.875rem", marginBottom: "16px" }}>
              Issue a token directly for walk-in attendees without mobile access.
            </p>

            <form onSubmit={handleAddAttendee}>
              <div className="form-group">
                <label htmlFor="attendee-name">Participant Name *</label>
                <input
                  id="attendee-name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={issuing} style={{ marginTop: "4px" }}>
                {issuing ? "Issuing..." : "🎟️ Issue Token"}
              </button>
            </form>
          </div>
        </div>

        {/* Participants Table Section */}
        <div className="card-section">
          <div className="toolbar">
            <h3>Event Participants ({filteredTokens.length})</h3>

            <div className="filter-group">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search participants (name or T001)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: "7px 12px", fontSize: "0.85rem" }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "auto", padding: "7px 12px", fontSize: "0.85rem" }}
              >
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="serving">Serving</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: "auto", padding: "7px 12px", fontSize: "0.85rem" }}
              >
                <option value="number-asc">Token # (Low → High)</option>
                <option value="number-desc">Token # (High → Low)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Participant</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <TableRowSkeleton cols={5} />
                    <TableRowSkeleton cols={5} />
                    <TableRowSkeleton cols={5} />
                  </>
                ) : tokens.length === 0 ? (
                  /* Friendly Empty Participants State */
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "44px 16px", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>👥</div>
                      <p style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-main)" }}>
                        No participants have joined this event yet.
                      </p>
                      <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        Share the QR code or join link with students to populate the queue.
                      </p>
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                      <p style={{ fontWeight: 600 }}>No participants match "{searchTerm}".</p>
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((t) => {
                    const tokenNumStr = formatTokenNumber(t.tokenNumber);
                    const isUpdating = updatingTokenId === t._id;
                    const isCompleted = t.status === "completed" || t.status === "done";
                    const isServing = t.status === "serving";

                    return (
                      <tr key={t._id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: "700", color: "var(--primary)" }}>
                            {tokenNumStr}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>
                          {isServing ? (
                            <span className="badge badge-serving">● Serving</span>
                          ) : isCompleted ? (
                            <span className="badge badge-completed">✓ Completed</span>
                          ) : (
                            <span className="badge badge-waiting">● Waiting</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                        <td>
                          {isCompleted ? (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>—</span>
                          ) : (
                            <div className="button-group">
                              {!isServing && (
                                <button
                                  onClick={() => handleStatusChange(t._id, t.tokenNumber, "serving")}
                                  className="btn btn-primary btn-sm"
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Serving..." : "Serve Now"}
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(t._id, t.tokenNumber, "completed")}
                                className="btn btn-success btn-sm"
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Updating..." : "Mark Completed"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ManageEvent;
