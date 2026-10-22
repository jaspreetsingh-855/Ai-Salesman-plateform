import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function MyIncomePage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const total = tasks.reduce((sum, task) => sum + (task.income || 0), 0);
  const doneIncome = tasks.filter((task) => task.status === "done").reduce((sum, task) => sum + (task.income || 0), 0);

  return (
    <div>
      {error && <p className="error-text">{error}</p>}
      <div className="stats-grid">
        <div className="stat-card"><small>Total recorded</small><strong>₹{total}</strong></div>
        <div className="stat-card"><small>From completed tasks</small><strong>₹{doneIncome}</strong></div>
      </div>
      <div className="panel">
        <h3>Income by task</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Task</th>
              <th>Status</th>
              <th>Income</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.date}</td>
                <td>{task.title}</td>
                <td><span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span></td>
                <td>₹{task.income || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyIncomePage;
