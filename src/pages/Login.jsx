import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { portalHome, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = await login(formData.email, formData.password);
      navigate(portalHome(user.role));
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={handleChange}
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Logging in..." : "Login"}
        </button>

        <div className="signup-section">
          <button type="button" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
        </div>

        <div className="signup-section">
          <h5>Don't have an account?</h5>
          <button type="button" onClick={() => navigate("/signup")}>Signup</button>
        </div>
      </form>
    </div>
  );
}

export default Login;
