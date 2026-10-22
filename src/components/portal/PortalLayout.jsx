import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./portal.css";

function PortalLayout({ links, title }) {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    const res = await api.get("/notifications");
    setNotifications(res.data);
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);
    return () => clearInterval(timer);
  }, []);

  const unread = notifications.filter((item) => !item.read).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    loadNotifications();
  };

  return (
    <div className="portal">
      <aside className="portal-sidebar">
        <Link to="/" className="portal-brand">
          <span>🤖</span>
          <strong>SalesNav AI</strong>
        </Link>
        <p className="portal-role">{title}</p>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <div>
            <h2>{title}</h2>
            <p>Welcome back, {user?.name}</p>
          </div>

          <div className="portal-top-actions">
            <button
              type="button"
              className="bell-btn"
              onClick={() => setOpen((value) => !value)}
            >
              Notifications
              {unread > 0 && <span>{unread}</span>}
            </button>
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Log out
            </button>
            <button type="button" className="ghost-btn" onClick={async () => { await logoutAll(); navigate("/"); }}>
              Logout all
            </button>
          </div>
        </header>

        {open && (
          <div className="notice-panel">
            <div className="notice-head">
              <strong>Notifications</strong>
              <button type="button" onClick={markAll}>Mark all read</button>
            </div>
            {notifications.length === 0 && <p>No notifications yet.</p>}
            {notifications.map((item) => (
              <article key={item._id} className={item.read ? "read" : ""}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </article>
            ))}
          </div>
        )}

        <div className="portal-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default PortalLayout;
