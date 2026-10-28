import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

const empty = { title: "", description: "", area: "", date: "", salesman: "", income: 0 };

function TasksPage() {
  const [salesmen, setSalesmen] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(empty);
  const [filters, setFilters] = useState({ date: "", salesman: "", status: "", search: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSalesmen = async () => {
    const res = await api.get("/users/salesmen");
    setSalesmen(res.data);
  };

  const loadTasks = async (next = filters) => {
    const res = await api.get("/tasks", { params: next });
    setTasks(res.data);
  };

  useEffect(() => {
    Promise.all([loadSalesmen(), loadTasks()]).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleFilter = (e) => {
    const next = { ...filters, [e.target.name]: e.target.value };
    setFilters(next);
    loadTasks(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tasks", form);
      setForm(empty);
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="panel">
        <h3>Create task</h3>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="title" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input name="area" placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <input name="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <select name="salesman" value={form.salesman} onChange={(e) => setForm({ ...form, salesman: e.target.value })} required>
              <option value="">Select salesman</option>
              {salesmen.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
            <input name="income" type="number" min="0" placeholder="Expected income" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
            <input name="description" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="primary-btn" type="submit">Assign task</button>
        </form>
      </div>

      <div className="panel">
        <h3>All tasks</h3>
        <div className="toolbar">
          <input type="date" name="date" value={filters.date} onChange={handleFilter} />
          <select name="salesman" value={filters.salesman} onChange={handleFilter}>
            <option value="">All salesmen</option>
            {salesmen.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
          <select name="status" value={filters.status} onChange={handleFilter}>
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <input name="search" placeholder="Search task" value={filters.search} onChange={handleFilter} />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Task</th>
              <th>Salesman</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.date}</td>
                <td>
                  <strong>{task.title}</strong>
                  <div className="muted">{task.area}</div>
                </td>
                <td>{task.salesman?.name}</td>
                <td><span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span></td>
                <td>{task.notes || "-"}</td>
                <td className="inline-actions">
                  <button className="small-btn" type="button" onClick={async () => {
                    try {
                      await api.post(`/tasks/${task._id}/remind`);
                      if (task.salesman?._id) {
                        const message = `Hi ${task.salesman.name}, reminder from SalesNav: ${task.title} (${task.date}). Please update the visit.`;
                        const res = await api.post("/messages/whatsapp", {
                          userId: task.salesman._id,
                          message
                        });
                        if (res.data.waLink) window.open(res.data.waLink, "_blank", "noopener,noreferrer");
                        setNotice(res.data.result?.sent ? res.data.note : "WhatsApp opened with the reminder.");
                      } else {
                        setNotice("In-app reminder saved.");
                      }
                    } catch (err) {
                      setError(getErrorMessage(err));
                    }
                  }}>WhatsApp</button>
                  <button className="danger-btn" type="button" onClick={async () => { await api.delete(`/tasks/${task._id}`); loadTasks(); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TasksPage;
