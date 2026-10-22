import { useEffect } from "react";
import PortalLayout from "../../components/portal/PortalLayout";
import api from "../../api/client";

function SalesmanLayout() {
  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const ping = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post("/location", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    ping();
    const timer = setInterval(ping, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <PortalLayout
      title="Salesman portal"
      links={[
        { to: "/salesman", label: "Dashboard", end: true },
        { to: "/salesman/agenda", label: "Today's agenda" },
        { to: "/salesman/tasks", label: "My tasks" },
        { to: "/salesman/routes", label: "My routes" },
        { to: "/salesman/map", label: "My map" },
        { to: "/salesman/attendance", label: "Attendance" },
        { to: "/salesman/leads", label: "Leads" },
        { to: "/salesman/income", label: "My income" }
      ]}
    />
  );
}

export default SalesmanLayout;
