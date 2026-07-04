import { useState } from "react";
import { login } from "../auth";

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (await login(userId, password)) {
        setError("");
        onLogin();
      } else {
        setError("Incorrect user ID or password.");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <img
              src="/logo1.png"
              alt="Saurabh's Rental Car Service Logo"
              style={{ width: "100%" }}
            />
          </div>
          {/* <h1>Saurabh's Rental<br />Car Service</h1>*/}
          <p>Sign in to your dashboard</p> 
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>User ID</label>
            <input
              required
              autoFocus
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <div className="login-password-wrap">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-submit">Sign in</button>
        </form>

        <p className="login-footer">Lucknow, Uttar Pradesh</p>
      </div>
    </div>
  );
}
