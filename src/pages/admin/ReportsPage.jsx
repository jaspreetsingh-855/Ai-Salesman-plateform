import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function ReportsPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  const [from, setFrom] = useState(monthStart.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [salesman, setSalesman] = useState("");
  const [salesmen, setSalesmen] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const load = async (next = { from, to, salesman }) => {
    const [people, data] = await Promise.all([
      api.get("/users/salesmen"),
      api.get("/reports", { params: { from: next.from, to: next.to, salesman: next.salesman || undefined } })
    ]);
    setSalesmen(people.data);
    setReport(data.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const download = async (type) => {
    const res = await api.get(`/reports/export.${type}`, {
      params: { from, to, salesman: salesman || undefined },
      responseType: "blob"
    });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report.${type}`;
    link.click();
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!report) return <div className="skeleton" />;

  return (
    <div>
      <div className="panel">
        <h3>Daily / weekly reports</h3>
        <div className="toolbar">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <select value={salesman} onChange={(e) => setSalesman(e.target.value)}>
            <option value="">All salesmen</option>
            {salesmen.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
          <button className="primary-btn" type="button" onClick={() => load({ from, to, salesman })}>Apply</button>
          <button className="ghost-btn" type="button" onClick={() => download("csv")}>Excel / CSV</button>
          <button className="ghost-btn" type="button" onClick={() => download("pdf")}>PDF</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><small>Assigned</small><strong>{report.assigned}</strong></div>
          <div className="stat-card"><small>Done</small><strong>{report.done}</strong></div>
          <div className="stat-card"><small>Completion</small><strong>{report.completion}%</strong></div>
          <div className="stat-card"><small>Income</small><strong>₹{report.income}</strong></div>
        </div>
      </div>

      <div className="panel">
        <h3>Target vs achievement</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Salesman</th>
              <th>Assigned</th>
              <th>Done</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {report.bySalesman.map((row) => (
              <tr key={row.salesmanId}>
                <td>{row.name}</td>
                <td>{row.assigned}</td>
                <td>{row.done}</td>
                <td>₹{row.income}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>By day</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assigned</th>
              <th>Done</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {report.byDay.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.assigned}</td>
                <td>{row.done}</td>
                <td>₹{row.income}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportsPage;
