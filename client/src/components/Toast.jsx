import React, { useEffect } from "react";

function Toast({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        <span>{message}</span>
        <button onClick={onClose} className="toast-close" aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}

export default Toast;
