import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function RoutesPage() {
  const [salesmen, setSalesmen] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ name: "", date: "", salesman: "", stops: [{ name: "", address: "" }] });
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [people, data] = await Promise.all([
      api.get("/users/salesmen"),
      api.get("/routes")
    ]);
    setSalesmen(people.data);
    setRoutes(data.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const updateStop = (index, key, value) => {
    const stops = [...form.stops];
    stops[index] = { ...stops[index], [key]: value };
    setForm({ ...form, stops });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/routes", form);
      setForm({ name: "", date: "", salesman: "", stops: [{ name: "", address: "" }] });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const suggest = async (salesman, date) => {
    const res = await api.post("/ai/route-suggestion", { salesmanId: salesman, date });
    setSuggestion(res.data.summary);
  };

  return (
    <div>
      <div className="panel">
        <h3>Create route</h3>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input placeholder="Route name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <select value={form.salesman} onChange={(e) => setForm({ ...form, salesman: e.target.value })} required>
              <option value="">Select salesman</option>
              {salesmen.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>

          {form.stops.map((stop, index) => (
            <div className="stop-row" key={index}>
              <input placeholder={`Stop ${index + 1} name`} value={stop.name} onChange={(e) => updateStop(index, "name", e.target.value)} required />
              <input placeholder="Address / area" value={stop.address} onChange={(e) => updateStop(index, "address", e.target.value)} />
              {index === form.stops.length - 1 ? (
                <button type="button" onClick={() => setForm({ ...form, stops: [...form.stops, { name: "", address: "" }] })}>+ Stop</button>
              ) : (
                <span />
              )}
            </div>
          ))}

          <button className="primary-btn" type="submit">Assign route</button>
        </form>
      </div>

      {suggestion && (
        <div className="panel">
          <h3>AI route suggestion</h3>
          <div className="ai-box">{suggestion}</div>
        </div>
      )}

      <div className="panel">
        <h3>Assigned routes</h3>
        {routes.map((route) => (
          <article key={route._id} style={{ marginBottom: 16 }}>
            <strong>{route.name}</strong>
            <p className="muted">{route.date} · {route.salesman?.name} · {route.stops.length} stops</p>
            <ol>
              {route.stops.map((stop) => (
                <li key={stop._id}>
                  {stop.name} {stop.address && `(${stop.address})`} — <span className={`badge ${stop.status}`}>{stop.status.replace("_", " ")}</span>
                </li>
              ))}
            </ol>
            <button className="small-btn" type="button" onClick={() => suggest(route.salesman?._id, route.date)}>AI suggest order</button>
            <button className="danger-btn" type="button" onClick={async () => { await api.delete(`/routes/${route._id}`); load(); }}>Delete</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export default RoutesPage;
