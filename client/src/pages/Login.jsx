import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../services/storage";
import Navbar from "../components/Navbar";

function Login() {
  const [email, setEmail] = useState("organizer@test.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await storage.login(email, password);
      if (data.jwt) {
        localStorage.setItem("jwt", data.jwt);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "440px", margin: 0 }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ fontSize: "1.65rem", marginBottom: "6px" }}>Organizer Login</h2>
            <p>Welcome back! Access your queue dashboard</p>
          </div>

          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Need an account?{" "}
            <Link to="/register" className="link-text">
              Register here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
