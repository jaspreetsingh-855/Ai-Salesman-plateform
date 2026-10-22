import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tasks").then((res) => setTasks(res.data)).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);

  return (
    <div className="panel">
      <h3>Task calendar</h3>
      {error && <p className="error-text">{error}</p>}
      {grouped.length === 0 && <p className="muted">No tasks to show on the calendar yet.</p>}
      <div className="calendar-grid">
        {grouped.map(([date, items]) => (
          <article key={date} className="calendar-day">
            <strong>{date}</strong>
            {items.map((task) => (
              <p key={task._id}>
                {task.title}
                <span className={`badge ${task.status}`}>{task.status.replace("_", " ")}</span>
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

export default CalendarPage;
