import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { storage } from "../services/storage";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";

function JoinEvent() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const urlTitle = searchParams.get("title");

  const [title, setTitle] = useState(urlTitle || "");
  const [name, setName] = useState("");
  const [myToken, setMyToken] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadEvent = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await storage.getPublicEvent(id, urlTitle);
      if (data && data.title) {
        setTitle(data.title);
      }
    } catch (err) {
      setError(err.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id, urlTitle]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);

    try {
      const data = await storage.joinEvent(id, name.trim(), title || urlTitle);
      setMyToken(data);
      setToast({ message: `Token #${data.tokenNumber} issued successfully!`, type: "success" });
    } catch (err) {
      setError(err.message || "Failed to issue token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!myToken) return;
    navigator.clipboard.writeText(`#${myToken.tokenNumber}`);
    setToast({ message: `Copied Token #${myToken.tokenNumber} to clipboard!`, type: "info" });
  };

  return (
    <div className="app-layout">
      <Navbar />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "480px", margin: 0 }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span className="badge badge-serving" style={{ marginBottom: "8px" }}>
              ● Live Queue
            </span>
            <h2 style={{ fontSize: "1.5rem", marginTop: "4px" }}>{title ? title : "Queue Registration"}</h2>
            <p style={{ fontSize: "0.9rem" }}>Get your digital queue token in seconds.</p>
          </div>

          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          {myToken ? (
            <div className="token-card">
              <span className="badge badge-done" style={{ marginBottom: "12px" }}>
                ✓ Token Generated Successfully
              </span>
              <div className="token-label">Your Token Number</div>
              <div className="token-number">#{myToken.tokenNumber}</div>

              <div style={{ margin: "16px 0", fontSize: "0.95rem" }}>
                <p style={{ color: "var(--text-main)", fontWeight: 600, margin: "4px 0" }}>
                  Attendee: {myToken.name}
                </p>
                <span className="badge badge-waiting" style={{ marginTop: "6px" }}>
                  ● {myToken.status.toUpperCase()}
                </span>
              </div>

              <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: "16px 0" }}>
                Please keep this screen open or save your token number. Wait until your number is called.
              </p>

              <div className="button-group" style={{ justifyContent: "center", marginTop: "20px" }}>
                <button onClick={handleCopyToken} className="btn btn-secondary btn-sm">
                  📋 Copy Token #
                </button>
                <button onClick={() => setMyToken(null)} className="btn btn-primary btn-sm">
                  + Request Another Token
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label htmlFor="join-name">Your Full Name</label>
                <input
                  id="join-name"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
                {loading ? "Generating Token..." : "🎟️ Get My Token"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default JoinEvent;
