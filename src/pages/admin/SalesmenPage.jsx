import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

const empty = { name: "", email: "", phone: "", password: "", monthlyTarget: 10 };

function SalesmenPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const res = await api.get("/users/salesmen");
    setRows(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users/salesmen", form);
      setForm(empty);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveTarget = async (id, monthlyTarget) => {
    await api.patch(`/users/salesmen/${id}`, { monthlyTarget });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/users/salesmen/${id}`);
    load();
  };

  return (
    <div>
      <div className="panel">
        <h3>Add salesman</h3>
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="muted">{notice}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <input name="monthlyTarget" type="number" min="0" placeholder="Monthly task target" value={form.monthlyTarget} onChange={handleChange} />
          </div>
          <button className="primary-btn" type="submit">Add salesman</button>
        </form>
      </div>

      <div className="panel">
        <h3>Team performance</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned</th>
              <th>Done</th>
              <th>Income</th>
              <th>Target</th>
              <th>Achievement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>{row.assigned}</td>
                <td>{row.done}</td>
                <td>₹{row.income}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={row.monthlyTarget}
                    style={{ width: 80 }}
                    onBlur={(e) => saveTarget(row.id, e.target.value)}
                  />
                </td>
                <td>{row.achievement}%</td>
                <td className="inline-actions">
                  <button className="small-btn" type="button" onClick={async () => {
                    try {
                      const message = `Hi ${row.name}, please check today's SalesNav tasks and route.`;
                      const res = await api.post("/messages/whatsapp", { userId: row.id, message });
                      if (res.data.waLink) window.open(res.data.waLink, "_blank", "noopener,noreferrer");
                      setNotice(res.data.result?.sent ? res.data.note : "WhatsApp opened with the reminder.");
                    } catch (err) {
                      setError(getErrorMessage(err));
                    }
                  }}>WhatsApp</button>
                  <button className="danger-btn" type="button" onClick={() => remove(row.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">No salesmen yet. Add one above.</p>}
      </div>
    </div>
  );
}

export default SalesmenPage;
