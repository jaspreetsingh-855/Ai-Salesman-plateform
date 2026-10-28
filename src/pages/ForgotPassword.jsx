import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import "./Login.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/forgot", { email });
      setMessage(res.data.message);
      setLink(res.data.resetUrl || "");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={submit}>
        <h1>Forgot password</h1>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="error-message" style={{ color: "#1c7c3c" }}>{message}</p>}
        {link && <p className="error-message"><a href={link}>Open reset link</a></p>}
        <p style={{ fontSize: 13, color: "#5b6478" }}>Works for admin and salesman. If EMAIL_USER is set, the link is emailed.</p>
        <button type="submit">Send reset link</button>
        <div className="signup-section">
          <button type="button" onClick={() => navigate("/login")}>Back to login</button>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;
