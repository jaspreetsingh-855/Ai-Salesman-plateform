import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function MyAgendaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [data, setData] = useState({ tasks: [], routes: [] });
  const [error, setError] = useState("");

  const load = async (nextDate = date) => {
    const res = await api.get("/reports/agenda", { params: { date: nextDate } });
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
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value); }} />
      </div>

      <h4>Tasks</h4>
      {data.tasks.map((task) => (
        <p key={task._id}>{task.title} — <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span></p>
      ))}
      {data.tasks.length === 0 && <p className="muted">No tasks today.</p>}

      <h4 style={{ marginTop: 16 }}>Route stops</h4>
      {data.routes.map((route) => (
        <div key={route._id}>
          <strong>{route.name}</strong>
          <ol>
            {route.stops.map((stop) => (
              <li key={stop._id}>{stop.name} — {stop.status.replace("_", " ")}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default MyAgendaPage;
