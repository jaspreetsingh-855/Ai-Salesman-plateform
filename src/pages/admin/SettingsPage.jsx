import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function SettingsPage() {
  const { logoutAll } = useAuth();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/settings").then((res) => setForm(res.data)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (!form) return <div className="skeleton" />;

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/settings", {
        ...form,
        areas: Array.isArray(form.areas) ? form.areas : String(form.areas).split(",")
      });
      setMessage("Settings saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="panel">
      <h3>Company settings</h3>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="muted">{message}</p>}
      <p className="muted">AI uses OPENAI_API_KEY or GEMINI_API_KEY. WhatsApp uses TWILIO_SID, TWILIO_TOKEN and TWILIO_WHATSAPP_FROM in server/.env.</p>
      <form onSubmit={save}>
        <div className="form-grid">
          <input value={form.companyName || ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company name" />
          <input value={form.aiTone || ""} onChange={(e) => setForm({ ...form, aiTone: e.target.value })} placeholder="AI tone" />
          <input type="time" value={form.workingHoursStart || ""} onChange={(e) => setForm({ ...form, workingHoursStart: e.target.value })} />
          <input type="time" value={form.workingHoursEnd || ""} onChange={(e) => setForm({ ...form, workingHoursEnd: e.target.value })} />
          <input
            value={Array.isArray(form.areas) ? form.areas.join(", ") : form.areas}
            onChange={(e) => setForm({ ...form, areas: e.target.value })}
            placeholder="Areas (comma separated)"
          />
        </div>
        <button className="primary-btn" type="submit">Save settings</button>
      </form>
      <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid #eef1f6" }} />
      <h3>Security</h3>
      <p className="muted">Log out from all browsers and devices.</p>
      <button className="danger-btn" type="button" onClick={logoutAll}>Logout all devices</button>
    </div>
  );
}

export default SettingsPage;
