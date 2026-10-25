import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function SalesmanDashboard() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [aiError, setAiError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const dash = await api.get("/reports/dashboard");
      setStats(dash.data);
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }

    setSummary("Loading AI summary...");
    try {
      const ai = await api.get("/ai/daily-summary");
      setSummary(ai.data.summary);
      setSource(ai.data.source);
      setAiError(ai.data.error || "");
    } catch (err) {
      setSource("local");
      setSummary("AI is busy. Stats still loaded — try refresh in a minute.");
      setAiError(getErrorMessage(err));
    }
  };

  const suggestRoute = async () => {
    const res = await api.post("/ai/route-suggestion", { date: stats?.today });
    setSuggestion(res.data.summary);
    setSource(res.data.source);
    setAiError(res.data.error || "");
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) return <div className="skeleton" />;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card"><small>Assigned this month</small><strong>{stats.assigned}</strong></div>
        <div className="stat-card"><small>Completed</small><strong>{stats.done}</strong></div>
        <div className="stat-card"><small>Target achievement</small><strong>{stats.achievement}%</strong></div>
        <div className="stat-card"><small>Income</small><strong>₹{stats.income}</strong></div>
      </div>

      <div className="panel">
        <h3>AI daily summary <small>({source || "local"})</small></h3>
        {aiError && <p className="error-text">{aiError}</p>}
        <div className="ai-box">{summary}</div>
        <div style={{ marginTop: 12 }}>
          <button className="primary-btn" type="button" onClick={suggestRoute}>Suggest today's route</button>
        </div>
        {suggestion && <div className="ai-box" style={{ marginTop: 12 }}>{suggestion}</div>}
      </div>
    </div>
  );
}

export default SalesmanDashboard;
