import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function SalesmanDashboard() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [dash, ai] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/ai/daily-summary")
      ]);
      setStats(dash.data);
      setSummary(ai.data.summary);
      setSource(ai.data.source);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const suggestRoute = async () => {
    const res = await api.post("/ai/route-suggestion", { date: stats?.today });
    setSuggestion(res.data.summary);
    setSource(res.data.source);
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
