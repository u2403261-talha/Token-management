import React, { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

function QRModal({ event, onClose, onCopyLink }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const joinUrl = `${window.location.origin}/join/${event._id}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{event.title}</h3>
            <p style={{ fontSize: "0.85rem", margin: "2px 0 0", color: "var(--text-muted)" }}>
              Scan QR Code to Join Queue
            </p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: "center" }}>
          <div className="qr-code-wrapper" style={{ display: "inline-block", margin: "16px 0" }}>
            <QRCodeSVG value={joinUrl} size={200} />
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "12px" }}>
            Students can scan this QR code with their mobile device camera to get a digital token.
          </p>

          <div
            style={{
              fontSize: "0.825rem",
              fontFamily: "monospace",
              color: "var(--primary)",
              background: "var(--bg-subtle)",
              padding: "8px 12px",
              borderRadius: "8px",
              wordBreak: "break-all",
              marginBottom: "20px",
              border: "1px solid var(--card-border)",
            }}
          >
            {joinUrl}
          </div>

          <div className="button-group" style={{ justifyContent: "center" }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(joinUrl);
                if (onCopyLink) onCopyLink();
              }}
              className="btn btn-primary"
            >
              📋 Copy Join Link
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRModal;
