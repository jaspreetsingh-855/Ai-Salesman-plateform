import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [salesman, setSalesman] = useState("");
  const [data, setData] = useState({ tasks: [], routes: [], salesmen: [] });
  const [error, setError] = useState("");

  const load = async (nextDate = date, nextSalesman = salesman) => {
    const res = await api.get("/reports/agenda", {
      params: { date: nextDate, salesman: nextSalesman || undefined }
    });
    setData(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="panel">
      <h3>Today's agenda</h3>
      {error && <p className="error-text">{error}</p>}
      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value, salesman); }} />
        <select value={salesman} onChange={(e) => { setSalesman(e.target.value); load(date, e.target.value); }}>
          <option value="">All salesmen</option>
          {data.salesmen.map((person) => (
            <option key={person._id} value={person._id}>{person.name}</option>
          ))}
        </select>
      </div>

      <h4>Tasks</h4>
      {data.tasks.length === 0 && <p className="muted">No tasks for this date.</p>}
      <table className="table">
        <tbody>
          {data.tasks.map((task) => (
            <tr key={task._id}>
              <td>{task.salesman?.name}</td>
              <td>{task.title}</td>
              <td><span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ marginTop: 20 }}>Routes</h4>
      {data.routes.map((route) => (
        <p key={route._id}>
          <strong>{route.salesman?.name}</strong>: {route.name} ({route.stops.filter((stop) => stop.status === "done").length}/{route.stops.length} stops done)
        </p>
      ))}
    </div>
  );
}

export default AgendaPage;
