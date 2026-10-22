import PortalLayout from "../../components/portal/PortalLayout";

export function AdminLayout() {
  return (
    <PortalLayout
      title="Admin portal"
      links={[
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/salesmen", label: "Salesmen" },
        { to: "/admin/tasks", label: "Tasks" },
        { to: "/admin/routes", label: "Routes" },
        { to: "/admin/agenda", label: "Agenda" },
        { to: "/admin/calendar", label: "Calendar" },
        { to: "/admin/map", label: "Live map" },
        { to: "/admin/attendance", label: "Attendance" },
        { to: "/admin/leads", label: "Leads" },
        { to: "/admin/reports", label: "Reports" },
        { to: "/admin/settings", label: "Settings" },
        { to: "/admin/audit", label: "Audit log" }
      ]}
    />
  );
}

export default AdminLayout;
