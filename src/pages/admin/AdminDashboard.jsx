import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "../../api/client";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [aiError, setAiError] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, rep] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/reports")
        ]);
        setStats(dash.data);
        setReport(rep.data);
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
    load();
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!stats) {
    return <div className="stats-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}</div>;
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card"><small>Assigned this month</small><strong>{stats.assigned}</strong></div>
        <div className="stat-card"><small>Completed</small><strong>{stats.done}</strong></div>
        <div className="stat-card"><small>Pending</small><strong>{stats.pending}</strong></div>
        <div className="stat-card"><small>Income</small><strong>₹{stats.income}</strong></div>
      </div>

      <div className="panel">
        <h3>AI daily summary <small>({source || "local"})</small></h3>
        {aiError && <p className="error-text">{aiError}</p>}
        <div className="ai-box">{summary}</div>
      </div>

      <div className="panel">
        <h3>Performance chart</h3>
        {report?.byDay?.length ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.byDay}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assigned" fill="#9aa6c7" />
                <Bar dataKey="done" fill="#4350ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="muted">No chart data yet. Assign tasks first.</p>}
      </div>

      <div className="panel">
        <h3>Today's tasks</h3>
        {stats.todayTasks.length === 0 && <p className="muted">No tasks for today.</p>}
        {stats.todayTasks.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Salesman</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.todayTasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.salesman?.name}</td>
                  <td><span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
