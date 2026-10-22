import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function AuditPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/audit").then((res) => setRows(res.data)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="panel">
      <h3>Audit log</h3>
      {error && <p className="error-text">{error}</p>}
      {rows.length === 0 && <p className="muted">No audit events yet.</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{new Date(row.createdAt).toLocaleString()}</td>
              <td>{row.actor?.name}</td>
              <td>{row.action}</td>
              <td>{row.entity}</td>
              <td>{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditPage;
