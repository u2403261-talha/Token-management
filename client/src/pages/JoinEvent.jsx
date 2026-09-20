// JoinEvent public page: allows attendees to enter their name and receive a token number.
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function JoinEvent() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [myToken, setMyToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch the public event title
  const loadEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/events/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load event");
        return;
      }
      setTitle(data.title);
    } catch (err) {
      setError("Network error loading event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  // Request a token by submitting attendee name
  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/public/events/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to get token");
        return;
      }

      // Display the received token on the same page
      setMyToken(data);
    } catch (err) {
      setError("Network error joining queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>{title ? title : "Queue Registration"}</h2>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading...</p>}

      {myToken ? (
        <div className="token-badge">
          <p>Your Token Number</p>
          <div className="number">#{myToken.tokenNumber}</div>
          <p>Name: <strong>{myToken.name}</strong></p>
          <p>Status: <strong>{myToken.status}</strong></p>
          <p style={{ fontSize: "13px", color: "#666" }}>Please wait until your number is called.</p>
        </div>
      ) : (
        <form onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            Get My Token
          </button>
        </form>
      )}
    </div>
  );
}

export default JoinEvent;
