import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function coords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 6000 }
    );
  });
}

function AttendancePage() {
  const { user } = useAuth();
  const isStaff = user.role !== "salesman";
  const [mine, setMine] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const me = await api.get("/attendance/me");
      setMine(me.data);
      if (isStaff) {
        const field = await api.get("/attendance");
        setRows(field.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const checkIn = async () => {
    await api.post("/attendance/check-in", await coords());
    load();
  };

  const checkOut = async () => {
    await api.post("/attendance/check-out", await coords());
    load();
  };

  return (
    <div>
      <div className="panel">
        <h3>Attendance</h3>
        {error && <p className="error-text">{error}</p>}
        <p className="muted">
          {mine?.checkInAt ? `Checked in at ${new Date(mine.checkInAt).toLocaleTimeString()}` : "Not checked in today."}
          {mine?.checkOutAt ? ` · Checked out ${new Date(mine.checkOutAt).toLocaleTimeString()}` : ""}
        </p>
        <div className="toolbar">
          <button className="primary-btn" type="button" onClick={checkIn} disabled={Boolean(mine?.checkInAt)}>Start day</button>
          <button className="ghost-btn" type="button" onClick={checkOut} disabled={!mine?.checkInAt || Boolean(mine?.checkOutAt)}>End day</button>
        </div>
      </div>

      {isStaff && (
        <div className="panel">
          <h3>Who is on field</h3>
          {rows.length === 0 && <p className="muted">No attendance records for today.</p>}
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.user?.name}</td>
                  <td>{row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : "-"}</td>
                  <td>{row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : "-"}</td>
                  <td>
                    <span className={`badge ${row.checkInAt && !row.checkOutAt ? "in_progress" : "done"}`}>
                      {row.checkInAt && !row.checkOutAt ? "On field" : row.checkOutAt ? "Done" : "Idle"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;
