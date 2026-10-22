import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { portalHome, useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin"
  });
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
      const user = await signup(formData);
      navigate(portalHome(user.role));
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="signup-page">
      <form onSubmit={handleSubmit}>
        <h1>Create account</h1>

        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" placeholder="Enter your name" onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="Enter your email" onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" placeholder="Enter your phone number" onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Enter your password" onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required>
            <option value="admin">Admin</option>
            <option value="salesman">Salesman</option>
          </select>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Account"}
        </button>

        <div className="login-section">
          <h5>Already have an account?</h5>
          <button type="button" onClick={() => navigate("/login")}>Login</button>
        </div>
      </form>
    </div>
  );
}

export default Signup;
