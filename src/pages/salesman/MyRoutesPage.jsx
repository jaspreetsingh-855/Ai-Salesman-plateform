import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";

function MyRoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/routes");
    setRoutes(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
  }, []);

  const updateStop = async (routeId, stopId, body) => {
    await api.patch(`/routes/${routeId}/stops/${stopId}`, body);
    load();
  };

  const photoDone = async (routeId, stopId, file) => {
    const body = new FormData();
    body.append("photo", file);
    await api.post(`/routes/${routeId}/stops/${stopId}/photo`, body);
    load();
  };

  const suggest = async (date) => {
    const res = await api.post("/ai/route-suggestion", { date });
    setSuggestion(res.data.summary);
  };

  return (
    <div>
      {error && <p className="error-text">{error}</p>}
      {suggestion && <div className="panel"><h3>AI route suggestion</h3><div className="ai-box">{suggestion}</div></div>}

      {routes.map((route) => (
        <div className="panel" key={route._id}>
          <h3>{route.name}</h3>
          <p className="muted">{route.date}</p>
          <button className="small-btn" type="button" onClick={() => suggest(route.date)}>AI suggest order</button>
          <ol>
            {route.stops.map((stop) => (
              <li key={stop._id} style={{ margin: "12px 0" }}>
                <strong>{stop.name}</strong> {stop.address && `— ${stop.address}`}
                <span className={`badge ${stop.status}`} style={{ marginLeft: 8 }}>{stop.status.replace("_", " ")}</span>
                {stop.photoUrl && <div><img className="proof-img" src={stop.photoUrl} alt="" /></div>}
                <div className="inline-actions" style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => updateStop(route._id, stop._id, { status: "in_progress" })}>Start</button>
                  <label className="small-btn">
                    Photo proof
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && photoDone(route._id, stop._id, e.target.files[0])} />
                  </label>
                  <button type="button" onClick={() => updateStop(route._id, stop._id, { status: "done" })}>Done</button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {routes.length === 0 && <p className="muted">No routes assigned yet.</p>}
    </div>
  );
}

export default MyRoutesPage;
