import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../services/storage";

function Navbar({ user, onLogout }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      storage.logout();
      navigate("/login");
    }
  };

  const currentUser = user || storage.getCurrentUser();
  const userName = currentUser?.name || currentUser?.email || "Organizer";
  const userInitials = userName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="brand-logo">
          <div className="brand-icon">Q</div>
          <span>QueueFlow</span>
        </Link>

        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-btn"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          {currentUser && (
            <>
              <div className="user-profile">
                <div className="avatar">{userInitials}</div>
                <span>{userName}</span>
              </div>
              <button onClick={handleLogoutClick} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
