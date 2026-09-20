// ManageEvent page: shows QR code, shareable link, token list, and mark-done actions.
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

function ManageEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const joinUrl = `${window.location.origin}/join/${id}`;

  // Fetch event details and its tokens
  const loadData = async () => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const eventRes = await fetch(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const eventData = await eventRes.json();
      if (!eventRes.ok) {
        setError(eventData.message || "Failed to load event");
        return;
      }
      setEvent(eventData);

      const tokensRes = await fetch(`/api/tokens?eventId=${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const tokensData = await tokensRes.json();
      if (!tokensRes.ok) {
        setError(tokensData.message || "Failed to load tokens");
        return;
      }
      setTokens(tokensData);
    } catch (err) {
      setError("Network error loading event data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Mark a waiting token as done
  const handleMarkDone = async (tokenId) => {
    const jwt = localStorage.getItem("jwt");
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: "done" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update token");
        return;
      }
      loadData();
    } catch (err) {
      setError("Network error updating token");
    }
  };

  return (
    <div className="container">
      <Link to="/dashboard" className="link-text">← Back to Dashboard</Link>
      <h2>{event ? event.title : "Event Details"}</h2>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading...</p>}

      <div className="qr-box">
        <p><strong>Scan QR to join queue:</strong></p>
        <QRCodeSVG value={joinUrl} size={160} />
        <a href={joinUrl} target="_blank" rel="noreferrer" className="link-text">{joinUrl}</a>
      </div>

      <div className="header-bar">
        <p><strong>Total people: {tokens.length}</strong></p>
        <button onClick={loadData} className="secondary">Refresh</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Token #</th>
            <th>Name</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t._id}>
              <td><strong>#{t.tokenNumber}</strong></td>
              <td>{t.name}</td>
              <td>{new Date(t.createdAt).toLocaleTimeString()}</td>
              <td>{t.status}</td>
              <td>
                {t.status === "waiting" ? (
                  <button onClick={() => handleMarkDone(t._id)} className="success">Mark Done</button>
                ) : (
                  <span>Done</span>
                )}
              </td>
            </tr>
          ))}
          {tokens.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>No attendees yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManageEvent;
