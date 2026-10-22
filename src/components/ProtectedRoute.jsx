import { Navigate } from "react-router-dom";
import { portalHome, useAuth } from "../context/AuthContext";

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="portal-loading">Loading portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={portalHome(user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
