import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import api, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function MapPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ people: [], routes: [] });
  const [self, setSelf] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (user.role === "salesman") {
          const [routesRes] = await Promise.all([api.get("/routes")]);
          setData({ people: [], routes: routesRes.data });
          navigator.geolocation?.getCurrentPosition((pos) => {
            setSelf({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        } else {
          const res = await api.get("/location/live");
          setData(res.data);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };
    load();
  }, [user.role]);

  const stopMarkers = data.routes.flatMap((route) =>
    (route.stops || [])
      .filter((stop) => stop.lat && stop.lng)
      .map((stop) => ({ ...stop, routeName: route.name, salesman: route.salesman?.name }))
  );

  const people = data.people.filter((person) => person.lastLocation?.lat);
  const center = self
    || people[0]?.lastLocation
    || stopMarkers[0]
    || { lat: 30.7333, lng: 76.7794 };

  return (
    <div className="panel">
      <h3>Live map</h3>
      <p className="muted">OpenStreetMap — salesman GPS and route stops. Allow location in the browser.</p>
      {error && <p className="error-text">{error}</p>}
      <div className="map-wrap">
        <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {self && (
            <Marker position={[self.lat, self.lng]}>
              <Popup>You</Popup>
            </Marker>
          )}
          {people.map((person) => (
            <Marker key={person._id} position={[person.lastLocation.lat, person.lastLocation.lng]}>
              <Popup>
                <strong>{person.name}</strong>
                <div>Updated {new Date(person.lastLocation.at).toLocaleTimeString()}</div>
              </Popup>
            </Marker>
          ))}
          {stopMarkers.map((stop) => (
            <Marker key={stop._id} position={[stop.lat, stop.lng]}>
              <Popup>
                <strong>{stop.name}</strong>
                <div>{stop.routeName} · {stop.salesman}</div>
                <div>{stop.status}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {people.length === 0 && stopMarkers.length === 0 && !self && (
        <p className="muted">No GPS points yet. Salesman must allow location, or add lat/lng on route stops.</p>
      )}
    </div>
  );
}

export default MapPage;
