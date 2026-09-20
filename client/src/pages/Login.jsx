// Login page: allows organizers to authenticate and saves the jwt to localStorage.
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Send login request with email and password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to log in");
        setLoading(false);
        return;
      }

      // Store the received jwt in localStorage and open dashboard
      localStorage.setItem("jwt", data.jwt);
      navigate("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Organizer Login</h2>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading...</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          Log In
        </button>
      </form>

      <p style={{ textAlign: "center" }}>
        Need an account? <Link to="/register" className="link-text">Register here</Link>
      </p>
    </div>
  );
}

export default Login;
