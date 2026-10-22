import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const empty = { name: "", phone: "", shop: "", area: "", stopName: "", notes: "", salesman: "" };

function LeadsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = async () => {
    const leads = await api.get("/leads");
    setRows(leads.data);
    if (user.role !== "salesman") {
      const people = await api.get("/users/salesmen");
      setSalesmen(people.data);
    }
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/leads", {
        ...form,
        salesman: user.role === "salesman" ? user.id : form.salesman
      });
      setForm(empty);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="panel">
        <h3>Add lead / customer</h3>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Shop / stop" value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} />
            <input placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <input placeholder="Linked stop name" value={form.stopName} onChange={(e) => setForm({ ...form, stopName: e.target.value })} />
            {user.role !== "salesman" && (
              <select value={form.salesman} onChange={(e) => setForm({ ...form, salesman: e.target.value })} required>
                <option value="">Select salesman</option>
                {salesmen.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            )}
          </div>
          <button className="primary-btn" type="submit">Save lead</button>
        </form>
      </div>

      <div className="panel">
        <h3>Leads</h3>
        {rows.length === 0 && <p className="muted">No customers yet. Add a lead for a shop stop.</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Shop</th>
              <th>Phone</th>
              <th>Salesman</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>{row.name}</td>
                <td>{row.shop || row.stopName}</td>
                <td>{row.phone}</td>
                <td>{row.salesman?.name}</td>
                <td>
                  <select defaultValue={row.status} onChange={(e) => api.patch(`/leads/${row._id}`, { status: e.target.value }).then(load)}>
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </td>
                <td>
                  <button className="danger-btn" type="button" onClick={() => api.delete(`/leads/${row._id}`).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadsPage;
