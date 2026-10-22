import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, portalHome, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AdminLayout } from "./pages/admin/StaffLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SalesmenPage from "./pages/admin/SalesmenPage";
import TasksPage from "./pages/admin/TasksPage";
import RoutesPage from "./pages/admin/RoutesPage";
import AgendaPage from "./pages/admin/AgendaPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import AuditPage from "./pages/admin/AuditPage";
import MapPage from "./pages/shared/MapPage";
import AttendancePage from "./pages/shared/AttendancePage";
import LeadsPage from "./pages/shared/LeadsPage";
import CalendarPage from "./pages/shared/CalendarPage";
import SalesmanLayout from "./pages/salesman/SalesmanLayout";
import SalesmanDashboard from "./pages/salesman/SalesmanDashboard";
import MyAgendaPage from "./pages/salesman/MyAgendaPage";
import MyTasksPage from "./pages/salesman/MyTasksPage";
import MyRoutesPage from "./pages/salesman/MyRoutesPage";
import MyIncomePage from "./pages/salesman/MyIncomePage";
import "./components/portal/portal.css";

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="portal-loading">Loading...</div>;
  if (user) return <Navigate to={portalHome(user.role)} replace />;
  return children;
}

function staffRoutes() {
  return (
    <>
      <Route index element={<AdminDashboard />} />
      <Route path="salesmen" element={<SalesmenPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="routes" element={<RoutesPage />} />
      <Route path="agenda" element={<AgendaPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="map" element={<MapPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="leads" element={<LeadsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="audit" element={<AuditPage />} />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        {staffRoutes()}
      </Route>

      <Route path="/salesman" element={<ProtectedRoute roles={["salesman"]}><SalesmanLayout /></ProtectedRoute>}>
        <Route index element={<SalesmanDashboard />} />
        <Route path="agenda" element={<MyAgendaPage />} />
        <Route path="tasks" element={<MyTasksPage />} />
        <Route path="routes" element={<MyRoutesPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="income" element={<MyIncomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
