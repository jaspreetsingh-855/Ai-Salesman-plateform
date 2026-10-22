import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "", search: "" });
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [income, setIncome] = useState({});

  const load = async (next = filters) => {
    const res = await api.get("/tasks", { params: next });
    setTasks(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const update = async (id, body) => {
    await api.patch(`/tasks/${id}`, body);
    load();
  };

  const uploadPhoto = async (id, file) => {
    const body = new FormData();
    body.append("photo", file);
    body.append("status", "done");
    body.append("notes", notes[id] || "");
    await api.post(`/tasks/${id}/photo`, body);
    load();
  };

  return (
    <div className="panel">
      <h3>My tasks</h3>
      {error && <p className="error-text">{error}</p>}
      <div className="toolbar">
        <input type="date" value={filters.date} onChange={(e) => {
          const next = { ...filters, date: e.target.value };
          setFilters(next);
          load(next);
        }} />
        <select value={filters.status} onChange={(e) => {
          const next = { ...filters, status: e.target.value };
          setFilters(next);
          load(next);
        }}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <input placeholder="Search" value={filters.search} onChange={(e) => {
          const next = { ...filters, search: e.target.value };
          setFilters(next);
          load(next);
        }} />
      </div>

      {tasks.map((task) => (
        <article key={task._id} style={{ borderBottom: "1px solid #eef1f6", padding: "12px 0" }}>
          <strong>{task.title}</strong>
          <p className="muted">{task.date} · {task.area || "No area"} · {task.description}</p>
          <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
          {task.photoUrl && <div><img className="proof-img" src={task.photoUrl} alt="Visit proof" /></div>}
          <div className="toolbar" style={{ marginTop: 10 }}>
            <button className="small-btn" type="button" onClick={() => update(task._id, { status: "in_progress" })}>Start</button>
            <input placeholder="Visit notes" defaultValue={task.notes} onChange={(e) => setNotes({ ...notes, [task._id]: e.target.value })} />
            <input type="number" placeholder="Income" defaultValue={task.income} onChange={(e) => setIncome({ ...income, [task._id]: e.target.value })} />
            <button className="small-btn" type="button" onClick={() => update(task._id, {
              notes: notes[task._id] ?? task.notes,
              income: income[task._id] ?? task.income
            })}>Save notes</button>
            <label className="small-btn">
              Photo + complete
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadPhoto(task._id, e.target.files[0])} />
            </label>
            <button className="primary-btn" type="button" onClick={() => update(task._id, {
              status: "done",
              notes: notes[task._id] ?? task.notes,
              income: income[task._id] ?? task.income
            })}>Complete</button>
          </div>
        </article>
      ))}
      {tasks.length === 0 && <p className="muted">No tasks assigned yet.</p>}
    </div>
  );
}

export default MyTasksPage;
